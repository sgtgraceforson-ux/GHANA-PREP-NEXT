/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // do not advertise the framework
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Other sites cannot embed the app in a frame (stops click-jacking).
          { key: "X-Frame-Options", value: "DENY" },
          // frame-ancestors: same protection for modern browsers. base-uri / object-src / form-action
          // close common injection routes. Script sources are not restricted here because the app
          // relies on inline styles and scripts; a full script policy is a separate, larger change.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
          // Browsers must not guess file types.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Do not leak full page addresses to other sites.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Always use https (browsers ignore this on http://localhost).
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // The app does not use these device features.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
      {
        // API answers are personal and must never be stored by shared caches.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
}

module.exports = nextConfig
