/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/action-items',
        destination: '/actions',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
