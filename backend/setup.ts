import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { staff, sites } from './src/schema';
import { eq } from 'drizzle-orm';

dotenv.config();

const setup = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('🚀 Starting database setup...');
  
  try {
    // Step 1: Run migrations
    console.log('📦 Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed!');

    // Step 2: Create test staff account (username: tom, password: jones123)
    console.log('👤 Creating test staff account...');
    const hashedPassword = await bcrypt.hash('jones123', 10);
    
    // Check if user already exists
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
      console.log('✅ Test staff account created (username: tom, password: jones123)');
    } else {
      console.log('ℹ️  Test staff account already exists');
    }

    // Step 3: Generate QR codes for sites
    console.log('🔲 Generating QR codes for sites...');
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
      } else {
        console.log(`ℹ️  QR code already exists for ${site.name}`);
      }
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }

  await pool.end();
  process.exit(0);
};

setup();

