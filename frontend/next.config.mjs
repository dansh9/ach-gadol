import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // The app serves only local static assets and never uses next/image, so the
  // Image Optimization API is pure attack surface here. Disabling it removes
  // the /_next/image endpoint entirely — including the SVG and AVIF remote
  // code execution advisories (GHSA-2464-fhr4-w9xw, GHSA-2xp9-vwfh-vxw4),
  // which have no fix in the 14.x line.
  images: { unoptimized: true },
};

export default withNextIntl(nextConfig);
