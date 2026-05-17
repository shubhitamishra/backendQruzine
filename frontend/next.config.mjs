/** @type {import('next').NextConfig} */
    const nextConfig = {
      images: {
        // Allow Cloudinary-hosted images
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'res.cloudinary.com',
            pathname: '/**/*',
          },
        ],
      },
    };

    export default nextConfig;
