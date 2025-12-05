import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mvorotvbainhtppatvnb.supabase.co",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**', // Izinkan semua path di domain ini
      },
    ],
  },
};

export default nextConfig;
