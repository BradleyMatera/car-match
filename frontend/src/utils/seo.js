const defaultTitle = 'CarMatch | Find Your Perfect Car Match';
const defaultDescription = 'CarMatch connects automotive enthusiasts through curated events, discussion forums, and personalized profiles. Find car shows, join forums, discover local auto shops.';
const defaultImage = 'https://bradleymatera.github.io/car-match/logo512.png';
const siteUrl = 'https://bradleymatera.github.io/car-match/';

const setMetaTag = (identifier, value, attr = 'name') => {
  if (!value || typeof document === 'undefined') return;
  let tag = document.head.querySelector(`meta[${attr}="${identifier}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, identifier);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
};

const setLinkTag = (rel, href) => {
  if (!href || typeof document === 'undefined') return;
  let link = document.head.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

export const applySEO = ({
  title,
  description = defaultDescription,
  canonical,
  image = defaultImage,
  jsonLd,
  breadcrumbs,
  faq,
} = {}) => {
  if (typeof document === 'undefined') return undefined;

  const resolvedTitle = title ? `${title} | CarMatch` : defaultTitle;
  document.title = resolvedTitle;

  setMetaTag('description', description);
  setMetaTag('keywords', 'car community, car shows, car meets, automotive events, car forums, car match, car enthusiasts, auto repair, car parts, Illinois car events');
  setMetaTag('author', 'Bradley Matera');
  setMetaTag('robots', 'index, follow');

  const canonicalHref = canonical || siteUrl;
  setLinkTag('canonical', canonicalHref);

  setMetaTag('og:title', resolvedTitle, 'property');
  setMetaTag('og:description', description, 'property');
  setMetaTag('og:type', 'website', 'property');
  setMetaTag('og:url', canonicalHref, 'property');
  setMetaTag('og:image', image, 'property');
  setMetaTag('og:site_name', 'CarMatch', 'property');

  setMetaTag('twitter:card', 'summary_large_image');
  setMetaTag('twitter:title', resolvedTitle);
  setMetaTag('twitter:description', description);
  setMetaTag('twitter:image', image);

  const cleanupFns = [];

  if (jsonLd) {
    const jsonScript = document.createElement('script');
    jsonScript.type = 'application/ld+json';
    jsonScript.text = JSON.stringify(jsonLd);
    document.head.appendChild(jsonScript);
    cleanupFns.push(() => { if (jsonScript.parentNode) jsonScript.parentNode.removeChild(jsonScript); });
  }

  if (breadcrumbs && breadcrumbs.length > 0) {
    const bcScript = document.createElement('script');
    bcScript.type = 'application/ld+json';
    bcScript.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: b.url,
      })),
    });
    document.head.appendChild(bcScript);
    cleanupFns.push(() => { if (bcScript.parentNode) bcScript.parentNode.removeChild(bcScript); });
  }

  if (faq && faq.length > 0) {
    const faqScript = document.createElement('script');
    faqScript.type = 'application/ld+json';
    faqScript.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
    document.head.appendChild(faqScript);
    cleanupFns.push(() => { if (faqScript.parentNode) faqScript.parentNode.removeChild(faqScript); });
  }

  return () => { cleanupFns.forEach(fn => fn()); };
};

export default applySEO;
