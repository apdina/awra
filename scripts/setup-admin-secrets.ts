#!/usr/bin/env tsx

/**
 * Setup script to migrate admin secrets from .env to Convex
 * Run this script once to securely store your admin secrets in Convex
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

async function setupAdminSecrets() {
  console.log('🔧 Setting up admin secrets in Convex...\n');

  // Get current values from environment (as fallback)
  const currentSecret = process.env.ADMIN_SECRET;
  const currentPassword = process.env.ADMIN_PASSWORD;

  if (!currentSecret || !currentPassword) {
    console.error('❌ ADMIN_SECRET and ADMIN_PASSWORD must be set in .env file first');
    console.log('Please add these to your .env file:');
    console.log('ADMIN_SECRET=your-secure-secret-min-32-chars');
    console.log('ADMIN_PASSWORD=your-secure-password-min-12-chars');
    process.exit(1);
  }

  // Validate strength
  if (currentSecret.length < 32) {
    console.error('❌ ADMIN_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  if (currentPassword.length < 12) {
    console.error('❌ ADMIN_PASSWORD must be at least 12 characters long');
    process.exit(1);
  }

  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Store admin secrets in Convex
    await convex.mutation(api.adminSecretSetup.setupAdminSecrets, {
      adminSecret: currentSecret,
      adminPassword: currentPassword,
    });

    console.log('✅ Admin secrets successfully migrated to Convex!');
    console.log('\n📝 Next steps:');
    console.log('1. Comment out or remove ADMIN_SECRET and ADMIN_PASSWORD from .env');
    console.log('2. Your admin authentication now uses Convex for secure storage');
    console.log('3. All API routes will automatically use the Convex-stored secrets');

  } catch (error) {
    console.error('❌ Failed to setup admin secrets:', error);
    process.exit(1);
  }
}

// Generate new secure secrets
async function generateNewSecrets() {
  console.log('🔐 Generating new secure admin secrets...\n');

  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    const result = await convex.mutation(api.adminSecretSetup.generateSecureAdminSecrets);
    
    console.log('🎲 New secrets generated:');
    console.log('\n🔑 Admin Secret:');
    console.log(result.adminSecret);
    console.log('\n🔒 Admin Password:');
    console.log(result.adminPassword);
    console.log('\n📋 Instructions:');
    console.log(result.instructions.nextStep);
    console.log('\n⚠️  Save these securely - they will not be shown again!');

  } catch (error) {
    console.error('❌ Failed to generate secrets:', error);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'migrate') {
  setupAdminSecrets();
} else if (command === 'generate') {
  generateNewSecrets();
} else {
  console.log('🔧 Admin Secrets Setup Tool\n');
  console.log('Usage:');
  console.log('  tsx scripts/setup-admin-secrets.ts migrate  - Migrate existing secrets from .env to Convex');
  console.log('  tsx scripts/setup-admin-secrets.ts generate - Generate new secure secrets');
  console.log('\nRecommended workflow:');
  console.log('1. Run "generate" to create new secure secrets');
  console.log('2. Run "migrate" to store them in Convex');
  console.log('3. Remove secrets from .env file');
}
