import { Request, Response } from 'express';
import { db } from './index.js';
import { staff, sites } from './schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export async function setupDatabase(req: Request, res: Response) {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const DATABASE_URL = process.env.DATABASE_URL || '';
    const pool = new Pool({ connectionString: DATABASE_URL });
    const migrationDb = drizzle(pool);

    // Step 1: Run migrations
    console.log('Running database migrations...');
    await migrate(migrationDb, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed');

    // Step 2: Create test staff account
    console.log('Creating test staff account...');
    const hashedPassword = await bcrypt.hash('jones123', 10);
    
    // Check if staff already exists
    const existingStaff = await db.select().from(staff).where(eq(staff.username, 'tom'));
    
    if (existingStaff.length === 0) {
      await db.insert(staff).values({
        name: 'Tom Jones',
        username: 'tom',
        password: hashedPassword,
        role: 'staff',
        email: 'tom@ecclesia.com',
        phone: '1234567890',
        active: true
      });
      console.log('✅ Test staff account created (username: tom, password: jones123)');
    } else {
      console.log('ℹ️  Test staff account already exists');
    }

    // Step 3: Generate QR codes for sites
    console.log('Generating QR codes for sites...');
    const allSites = await db.select().from(sites);
    
    for (const site of allSites) {
      if (!site.qrCode) {
        const qrCodeData = `SITE:${site.id}:${site.name}`;
        await db.update(sites)
          .set({ qrCode: qrCodeData })
          .where(eq(sites.id, site.id));
        console.log(`✅ QR code generated for ${site.name}`);
      }
    }

    await pool.end();

    res.json({
      success: true,
      message: 'Database setup completed successfully',
      details: {
        migrations: 'completed',
        testAccount: existingStaff.length === 0 ? 'created' : 'already exists',
        qrCodes: 'generated',
        credentials: {
          username: 'tom',
          password: 'jones123'
        }
      }
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      error: 'Database setup failed',
      details: error.message
    });
  }
}

