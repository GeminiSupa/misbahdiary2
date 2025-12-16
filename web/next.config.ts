import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for Vercel
  output: 'standalone',
  
  // Reduce bundle size
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      'lucide-react',
      'recharts',
    ],
  },

  // Turbopack configuration (Next.js 16 default)
  turbopack: {},

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
