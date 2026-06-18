import type { MetadataRoute } from 'next';

const BASE_URL = 'https://classorbit.co';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/*',
        '/api/',
        '/callback',
        '/builder',
        '/workspace',
        '/tools',
        '/settings',
        '/profile',
        '/upgrade',
        '/help',
        '/prompts',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
