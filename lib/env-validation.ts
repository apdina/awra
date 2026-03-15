// Environment Variable Validation
// Square payment integration removed

// Validate all required environment variables on startup
export const validateEnvironmentVariables = () => {
  const errors: string[] = [];

  // Square validation removed - payment integration discontinued

  // Skrill validation (only if Skrill is being used)
  const requiredSkrillVars = ['SKRILL_MERCHANT_EMAIL', 'SKRILL_SECRET_WORD'];
  requiredSkrillVars.forEach(varName => {
    if (!process.env[varName]) {
      // Only require Skrill vars if Skrill is configured
      if (process.env.SKRILL_MERCHANT_EMAIL || process.env.NODE_ENV === 'production') {
        if (process.env.NODE_ENV === 'production') {
          errors.push(`Missing required Skrill environment variable: ${varName}`);
        } else {
          console.warn(`⚠️ Skrill environment variable missing (development mode): ${varName}`);
        }
      }
    }
  });

  // Site configuration (only require in production)
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_APP_URL) {
      errors.push('Missing NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL');
    }
  }

  // Convex configuration
  const requiredConvexVars = [
    'NEXT_PUBLIC_CONVEX_URL',
  ];
  
  requiredConvexVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required Convex environment variable: ${varName}`);
    }
  });

  // Payment processing limits
  const paymentLimits = ['MIN_DEPOSIT_AMOUNT', 'MAX_DEPOSIT_AMOUNT'];
  paymentLimits.forEach(varName => {
    const value = process.env[varName];
    if (value && isNaN(parseInt(value))) {
      errors.push(`${varName} must be a valid number`);
    }
  });

  if (errors.length > 0) {
    console.error('❌ Environment Variable Validation Errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed. Please check your configuration.');
    } else {
      console.warn('⚠️ Running with missing environment variables in development mode');
    }
  } else {
    console.log('✅ All environment variables validated successfully');
  }
};

// Runtime validation for critical operations
export const validatePaymentEnvironment = () => {
  const criticalVars = [
    'NEXT_PUBLIC_CONVEX_URL',
  ];

  const missing = criticalVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing critical environment variables: ${missing.join(', ')}`);
  }
};

// Export validation function to be called on app startup
export default validateEnvironmentVariables;
