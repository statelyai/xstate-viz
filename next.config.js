const registryPublicUrl =
  process.env.NEXT_PUBLIC_REGISTRY_PUBLIC_URL ||
  `https://dev.stately.ai/registry`;
const landingPagePublicUrl = `https://landing-page-prod.stately.ai`;

/** @type import('next').NextConfig */
module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    /**
     * This is checked on CI anyway, so we'll never
     * deploy anything that has type errors
     */
    ignoreBuildErrors: true,
  },
  basePath: `/viz`,
  productionBrowserSourceMaps: true,
  /**
   * These rewrites are never used in production - only in development
   */
  async rewrites() {
    return [
      {
        source: `/registry/:match*`,
        basePath: false,
        destination: `${registryPublicUrl}/:match*`,
      },
      {
        source: `/`,
        destination: `${landingPagePublicUrl}`,
        basePath: false,
      },
    ];
  },
};
