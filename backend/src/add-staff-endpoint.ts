import { Request, Response } from 'express';
import { staff } from './schema.js';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export async function addStaffAccounts(req: Request, res: Response) {
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const pool = new Pool({ connectionString: DATABASE_URL });
    const db = drizzle(pool);

    const testAccounts = [
      { name: 'Tom Jones', username: 'tom', password: 'jones123' },
      { name: 'Michael Kenny', username: 'michael', password: 'kenny123' },
      { name: 'Tim Bin', username: 'tim', password: 'bin123' },
      { name: 'Lauren Diedericks', username: 'lauren', password: 'diedericks123' }
    ];
    
    // Check existing staff
    const existingStaff = await db.select().from(staff);
    const existingUsernames = existingStaff.map(s => s.username);
    
    const created = [];
    const skipped = [];
    
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
        created.push(account.username);
        console.log(`✅ Created account: ${account.username}`);
      } else {
        skipped.push(account.username);
        console.log(`ℹ️  Account already exists: ${account.username}`);
      }
    }

    await pool.end();

    res.json({
      success: true,
      message: 'Staff accounts processed',
      details: {
        created: created,
        skipped: skipped,
        total: testAccounts.length,
        credentials: testAccounts.map(a => ({ 
          name: a.name,
          username: a.username, 
          password: a.password 
        }))
      }
    });

  } catch (error: any) {
    console.error('Add staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add staff accounts',
      details: error.message
    });
  }
}

