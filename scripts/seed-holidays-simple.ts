import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const ADMIN_SECRET = process.env.ADMIN_SECRET!;

async function seed() {
  console.log("🌟 Seeding holidays...");
  
  const dates = ["25/12/2025", "26/12/2025", "01/01/2026"];
  
  for (const dateStr of dates) {
    try {
      const result = await convex.mutation(api.holidays.addHoliday, {
        dateStr,
        adminSecret: ADMIN_SECRET
      });
      console.log(`✅ ${dateStr}:`, result.holidays);
    } catch (error: any) {
      console.error(`❌ ${dateStr}:`, error.message);
    }
  }
  
  // Query final list
  const final = await convex.query(api.holidays.getHolidays);
  console.log(`\n📅 Total holidays: ${final.length}`);
  console.log(final);
}

seed();
