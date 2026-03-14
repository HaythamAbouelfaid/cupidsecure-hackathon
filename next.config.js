/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const isDev = process.env.NODE_ENV !== 'production';
    const apiUrl = isDev ? 'http://127.0.0.1:5001' : '/api/index';
    
    return {
      fallback: [
        // Map all other routes to Flask if they don't match a Next.js page
        {
          source: '/:path*',
          destination: `${apiUrl}/:path*`,
        },
        {
          source: '/',
          destination: `${apiUrl}/`,
        }
      ]
    }
  }
}

module.exports = nextConfig
