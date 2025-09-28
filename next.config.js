/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilitar o modo estrito para melhor detecção de problemas
  reactStrictMode: true,
  
  // Configurações de imagens
  images: {
    // Permitir imagens de qualquer origem (para avatares de usuário, etc.)
    domains: ['*', 'lh3.googleusercontent.com'],
    remotePatterns: [
      { protocol: 'https', hostname: '*' },
      { protocol: 'http', hostname: '*' },
    ],
  },
  
  // Configurações de segurança de cabeçalhos
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Configurações de redirecionamento para autenticação
  async redirects() {
    return [
      {
        source: '/auth/signin',
        destination: '/api/auth/signin',
        permanent: true,
      },
      {
        source: '/auth/signout',
        destination: '/api/auth/signout',
        permanent: true,
      },
      {
        source: '/auth/error',
        destination: '/api/auth/error',
        permanent: true,
      },
    ];
  },
  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        resourceQuery: { not: /url/ }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      }
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: "/sitemap.xml",
  //       destination: "/api/sitemap",
  //     },
  //   ];
  // },
};

module.exports = nextConfig;
