const defaultTitle = 'CarMatch | Find Your Perfect Car Match';
const defaultDescription = 'CarMatch connects automotive enthusiasts through curated events, discussion forums, and personalized profiles.';
const defaultImage = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70';
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
} = {}) => {
  if (typeof document === 'undefined') return undefined;

  const resolvedTitle = title ? `${title} | CarMatch` : defaultTitle;
  document.title = resolvedTitle;

  setMetaTag('description', description);
  setMetaTag('keywords', 'car community, car meetups, automotive events, car forums, car match, car enthusiasts');
  setMetaTag('author', 'Bradley Matera');

  const canonicalHref = canonical || siteUrl;
  setLinkTag('canonical', canonicalHref);

  setMetaTag('og:title', resolvedTitle, 'property');
  setMetaTag('og:description', description, 'property');
  setMetaTag('og:type', 'website', 'property');
  setMetaTag('og:url', canonicalHref, 'property');
  setMetaTag('og:image', image, 'property');

  setMetaTag('twitter:card', 'summary_large_image');
  setMetaTag('twitter:title', resolvedTitle);
  setMetaTag('twitter:description', description);
  setMetaTag('twitter:image', image);

  let jsonScript;
  if (jsonLd) {
    jsonScript = document.createElement('script');
    jsonScript.type = 'application/ld+json';
    jsonScript.text = JSON.stringify(jsonLd);
    document.head.appendChild(jsonScript);
  }

  return () => {
    if (jsonScript && jsonScript.parentNode) {
      jsonScript.parentNode.removeChild(jsonScript);
    }
  };
};

export default applySEO;
