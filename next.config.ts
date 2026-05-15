/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    reactCompiler: false,
  },
};

export default nextConfig;
