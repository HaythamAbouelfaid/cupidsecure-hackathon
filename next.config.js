/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const isDev = process.env.NODE_ENV !== 'production';
    const apiUrl = isDev ? 'http://127.0.0.1:5001' : '/api/index';
    
    return [
      {
        source: '/:path*',
        has: [
            {
                type: 'header',
                key: 'accept',
                value: '^(?!.*text/html).*$'
            }
        ],
        destination: `${apiUrl}/:path*`, // Proxy API/Non-HTML requests directly down to Flask
      },
      {
        source: '/dashboard',
        destination: `${apiUrl}/dashboard`,
      },
      {
        source: '/enterprise-dashboard',
        destination: `${apiUrl}/enterprise-dashboard`,
      },
      {
        source: '/analyze',
        destination: `${apiUrl}/analyze`,
      },
      {
        source: '/simulator',
        destination: `${apiUrl}/simulator`,
      },
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`, // Prevent collision with next api routes if any 
      },
      {
        source: '/',
        destination: `${apiUrl}/`,
      }
    ]
  }
}

module.exports = nextConfig
