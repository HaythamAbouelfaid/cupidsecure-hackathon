/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
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
        destination: 'http://127.0.0.1:5001/:path*', // Proxy API/Non-HTML requests directly down to Flask
      },
      {
        source: '/dashboard',
        destination: 'http://127.0.0.1:5001/dashboard',
      },
      {
        source: '/enterprise-dashboard',
        destination: 'http://127.0.0.1:5001/enterprise-dashboard',
      },
      {
        source: '/analyze',
        destination: 'http://127.0.0.1:5001/analyze',
      },
      {
        source: '/simulator',
        destination: 'http://127.0.0.1:5001/simulator',
      },
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5001/api/:path*',
      },
      {
        source: '/',
        destination: 'http://127.0.0.1:5001/',
      }
    ]
  }
}

module.exports = nextConfig
