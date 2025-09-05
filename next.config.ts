import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mvorotvbainhtppatvnb.supabase.co",
      },
    ],
  },
};

export default nextConfig;
