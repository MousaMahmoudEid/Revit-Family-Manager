/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  // Allow embedding the app in an iframe (e.g. Teable's app preview)
  // and any other host. The app has no auth, so this matches the
  // "use the link anywhere without logging in" requirement.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      },
    ];
  },
}

export default nextConfig
