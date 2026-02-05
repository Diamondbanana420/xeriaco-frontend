/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export — Express serves the built files
  output: 'export',
  trailingSlash: true,

  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '**.unsplash.com' },
      { protocol: 'https', hostname: '**.alicdn.com' },
      { protocol: 'https', hostname: '**.aliexpress.com' },
      { protocol: 'https', hostname: '**.cjdropshipping.com' },
    ],
  },
};

module.exports = nextConfig;
