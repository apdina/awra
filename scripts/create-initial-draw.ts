#!/usr/bin/env tsx
/**
 * Create Initial Draw
 * 
 * Creates an active draw in Supabase so users can purchase tickets
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function createInitialDraw() {
  console.log('🎰 Creating initial draw...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Check if there's already an unprocessed draw
  const { data: existingDraw, error: checkError } = await supabase
    .from('draws')
    .select('*')
    .eq('is_processed', false)
    .order('draw_date', { ascending: false })
    .limit(1)
    .single();

  if (existingDraw && !checkError) {
    console.log('✅ Active draw already exists:');
    console.log(`   Draw ID: ${existingDraw.id}`);
    console.log(`   Draw Date: ${existingDraw.draw_date}`);
    console.log(`   Draw Time: ${existingDraw.draw_time}`);
    console.log(`   Processed: ${existingDraw.is_processed}`);
    return;
  }

  // Create a new draw for today
  const today = new Date();
  const drawDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

  const { data: newDraw, error: createError } = await supabase
    .from('draws')
    .insert({
      draw_date: drawDate,
      draw_time: '21:40:00', // 9:40 PM
      winning_number: null,
      is_processed: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Failed to create draw:', createError);
    process.exit(1);
  }

  console.log('✅ Created new active draw:');
  console.log(`   Draw ID: ${newDraw.id}`);
  console.log(`   Draw Date: ${newDraw.draw_date}`);
  console.log(`   Draw Time: ${newDraw.draw_time}`);
  console.log(`   Processed: ${newDraw.is_processed}`);
  console.log('\n🎉 Users can now purchase tickets!');
}

createInitialDraw().catch(console.error);
