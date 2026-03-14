/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const isDev = process.env.NODE_ENV !== 'production';
    const apiUrl = isDev ? 'http://127.0.0.1:5001' : '/api/index';
    
    return [
      { source: '/dashboard', destination: `${apiUrl}/dashboard` },
      { source: '/enterprise-dashboard', destination: `${apiUrl}/enterprise-dashboard` },
      { source: '/analyze', destination: `${apiUrl}/analyze` },
      { source: '/simulator', destination: `${apiUrl}/simulator` },
      { source: '/privacy', destination: `${apiUrl}/privacy` },
      { source: '/report', destination: `${apiUrl}/report` },
      { source: '/api/:path*', destination: `${apiUrl}/api/:path*` },
      { source: '/static/:path*', destination: `${apiUrl}/static/:path*` },
      { source: '/', destination: `${apiUrl}/` }
    ]
  }
}

module.exports = nextConfig
