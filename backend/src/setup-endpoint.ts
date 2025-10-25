import { Request, Response } from 'express';
import { staff, sites } from './schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export async function setupDatabase(req: Request, res: Response) {
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const pool = new Pool({ connectionString: DATABASE_URL });
    const db = drizzle(pool);

    // Step 1: Run migrations
    console.log('Running database migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed');

    // Step 2: Create test staff accounts
    console.log('Creating test staff accounts...');
    
    const testAccounts = [
      { name: 'Tom Jones', username: 'tom', password: 'jones123' },
      { name: 'Michael Kenny', username: 'michael', password: 'kenny123' },
      { name: 'Tim Bin', username: 'tim', password: 'bin123' },
      { name: 'Lauren Diedericks', username: 'lauren', password: 'diedericks123' }
    ];
    
    // Check existing staff
    const existingStaff = await db.select().from(staff);
    const existingUsernames = existingStaff.map(s => s.username);
    
    let createdCount = 0;
    for (const account of testAccounts) {
      if (!existingUsernames.includes(account.username)) {
        const hashedPassword = await bcrypt.hash(account.password, 10);
        await db.insert(staff).values({
          name: account.name,
          username: account.username,
          password: hashedPassword,
          role: 'Worker',
          site: 'General',
          status: 'Active',
          rates: '£12.50/hr'
        });
        console.log(`✅ Created account: ${account.username}`);
        createdCount++;
      } else {
        console.log(`ℹ️  Account already exists: ${account.username}`);
      }
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
        staffAccounts: `${createdCount} created, ${testAccounts.length - createdCount} already existed`,
        qrCodes: 'generated',
        credentials: testAccounts.map(a => ({ username: a.username, password: a.password }))
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

