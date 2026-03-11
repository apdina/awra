import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ... other config options
  
  // Security headers via proxy
  headers: async () => {
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico|public).*)',
        headers: [
          // ============================================
          // HSTS (HTTP Strict Transport Security)
          // ============================================
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          
          // ============================================
          // Content Security Policy (CSP)
          // ============================================
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.socket.io",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
              "connect-src 'self' https: wss: ws:",
              "media-src 'self' https: blob:",
              "frame-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          
          // ============================================
          // X-Frame-Options (Clickjacking Protection)
          // ============================================
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          
          // ============================================
          // X-Content-Type-Options (MIME Sniffing Protection)
          // ============================================
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          
          // ============================================
          // X-XSS-Protection (Legacy XSS Protection)
          // ============================================
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          
          // ============================================
          // Referrer-Policy (Information Disclosure)
          // ============================================
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          
          // ============================================
          // Permissions-Policy (Feature Policy)
          // ============================================
          {
            key: 'Permissions-Policy',
            value: [
              'geolocation=()',
              'microphone=()',
              'camera=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'accelerometer=()',
              'vr=()',
              'xr-spatial-tracking=()',
            ].join(', '),
          },
          
          // ============================================
          // Cache Control Headers
          // ============================================
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          
          // ============================================
          // Additional Security Headers
          // ============================================
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
