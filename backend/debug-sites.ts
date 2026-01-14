
import { db } from './src/db';
import { sites } from './src/schema';
import dotenv from 'dotenv';

dotenv.config();

async function listSites() {
    if (!db) {
        console.error('Database configuration missing');
        return;
    }

    console.log('🔍 Listing all sites in database...');
    try {
        const allSites = await db.select().from(sites);
        console.log('--------------------------------------------------');
        console.log('ID                                     | Name');
        console.log('--------------------------------------------------');
        allSites.forEach(site => {
            console.log(`${site.id.padEnd(38)} | ${site.name}`);
            console.log(`   Expect QR: SITE_${site.id}`); // Helpful output
        });
        console.log('--------------------------------------------------');
    } catch (err) {
        console.error('Error fetching sites:', err);
    } finally {
        process.exit(0);
    }
}

listSites();
