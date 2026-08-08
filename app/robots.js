export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://devinedesk.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/admin/', '/workspace/', '/settings/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
