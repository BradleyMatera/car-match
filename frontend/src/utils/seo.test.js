import { applySEO } from './seo';

describe('applySEO', () => {
  afterEach(() => {
    // Clean up document head between tests
    document.head.innerHTML = '';
    document.title = '';
  });

  test('sets document.title', () => {
    applySEO({ title: 'Events' });
    expect(document.title).toBe('Events | CarMatch');
  });

  test('sets default title when no title provided', () => {
    applySEO({});
    expect(document.title).toBe('CarMatch | Find Your Perfect Car Match');
  });

  test('sets meta description', () => {
    applySEO({ description: 'Custom description for the page.' });
    const meta = document.head.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta.getAttribute('content')).toBe('Custom description for the page.');
  });

  test('sets canonical link', () => {
    applySEO({ canonical: 'https://example.com/page' });
    const link = document.head.querySelector('link[rel="canonical"]');
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('https://example.com/page');
  });

  test('injects JSON-LD script when jsonLd provided', () => {
    applySEO({ jsonLd: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'CarMatch' } });
    const script = document.head.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const parsed = JSON.parse(script.text);
    expect(parsed.name).toBe('CarMatch');
  });

  test('does not inject JSON-LD when not provided', () => {
    applySEO({ title: 'No JSON-LD' });
    const script = document.head.querySelector('script[type="application/ld+json"]');
    expect(script).toBeNull();
  });

  test('returns cleanup function that removes JSON-LD', () => {
    const cleanup = applySEO({ jsonLd: { test: true } });
    expect(document.head.querySelector('script[type="application/ld+json"]')).not.toBeNull();
    cleanup();
    expect(document.head.querySelector('script[type="application/ld+json"]')).toBeNull();
  });
});
