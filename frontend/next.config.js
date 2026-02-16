/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@react-three/drei', 'troika-three-text', 'bidi-js', 'webgl-sdf-generator'],
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [],
      },
    ]
  },
}

module.exports = nextConfig
