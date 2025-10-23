import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { sites } from './src/schema';
import QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const generateQRCodes = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('🔲 Generating QR codes for all sites...');
  
  try {
    const allSites = await db.select().from(sites);
    
    if (allSites.length === 0) {
      console.log('⚠️  No sites found in database');
      await pool.end();
      process.exit(0);
    }

    // Create QR codes directory
    const qrDir = path.join(process.cwd(), 'qr-codes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    console.log(`\n📍 Found ${allSites.length} sites:\n`);

    for (const site of allSites) {
      const qrData = site.qrCode || `SITE:${site.id}:${Date.now()}`;
      const filename = `${site.id}_${site.name.replace(/\s+/g, '_')}.png`;
      const filepath = path.join(qrDir, filename);

      // Generate QR code as PNG
      await QRCode.toFile(filepath, qrData, {
        width: 500,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      console.log(`✅ ${site.name}`);
      console.log(`   ID: ${site.id}`);
      console.log(`   Location: ${site.location}`);
      console.log(`   QR Code: ${qrData}`);
      console.log(`   File: ${filename}\n`);
    }

    console.log(`\n🎉 QR codes generated successfully!`);
    console.log(`📁 Location: ${qrDir}`);
    console.log(`\n💡 Print these QR codes and display them at each care site.`);
    console.log(`   Staff can scan them to clock in/out using the mobile app.\n`);

  } catch (error) {
    console.error('❌ Error generating QR codes:', error);
    process.exit(1);
  }

  await pool.end();
  process.exit(0);
};

generateQRCodes();

