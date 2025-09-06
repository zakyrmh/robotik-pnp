module.exports = {
  siteUrl: "https://robotik-pnp.vercel.app",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 5000,
  exclude: [
    "/dashboard/*",
    "/pendaftaran/*",
    "/action/*",
    "/caang/*",
    "/forgot-password/*",
    "/login/*",
    "/verify-email/*",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/pendaftaran",
          "/action",
          "/caang",
          "/forgot-password",
          "/login",
          "/verify-email",
        ],
      },
    ],
    additionalSitemaps: ["https://robotik-pnp.vercel.app/sitemap.xml"],
  },
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
};
