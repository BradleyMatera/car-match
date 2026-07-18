#!/usr/bin/env node
/**
 * SEO/GEO/AEO Audit Script for CarMatch
 * Runs Lighthouse audits and checks structured data, meta tags, and search engine optimization.
 *
 * Usage: node scripts/seo-audit.js [url]
 * Default URL: https://bradleymatera.github.io/car-match/
 *
 * Checks:
 * - Lighthouse: Performance, Accessibility, Best Practices, SEO
 * - SEO: meta tags, canonical, sitemap, robots.txt, structured data
 * - GEO: geo meta tags, region, coordinates, local business schema
 * - AEO: FAQ schema, breadcrumb schema, answer-friendly content, voice search optimization
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const URL = process.argv[2] || 'https://bradleymatera.github.io/car-match/';
const OUTPUT_DIR = '/tmp/seo-audit';

// Colors for console output
const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const pass = (msg) => console.log(`${C.green}  ✓${C.reset} ${msg}`);
const fail = (msg) => console.log(`${C.red}  ✗${C.reset} ${msg}`);
const warn = (msg) => console.log(`${C.yellow}  ⚠${C.reset} ${msg}`);
const info = (msg) => console.log(`${C.blue}  ℹ${C.reset} ${msg}`);

const section = (title) => {
  console.log(`\n${C.bold}${C.cyan}═══ ${title} ═══${C.reset}\n`);
};

const fetch = (url) => new Promise((resolve, reject) => {
  const mod = url.startsWith('https') ? https : http;
  mod.get(url, { timeout: 15000 }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
  }).on('error', reject);
});

async function runLighthouse() {
  section('LIGHTHOUSE AUDIT');
  try {
    const cmd = `lighthouse "${URL}" --output=json --output-path=${OUTPUT_DIR}/lh.json --chrome-flags="--headless --no-sandbox --disable-gpu" --preset=desktop --only-categories=performance,accessibility,best-practices,seo 2>&1`;
    info('Running Lighthouse (this takes ~30s)...');
    execSync(cmd, { stdio: 'pipe', timeout: 120000 });
    const lh = JSON.parse(fs.readFileSync(`${OUTPUT_DIR}/lh.json`, 'utf8'));
    const scores = {};
    for (const [key, cat] of Object.entries(lh.categories)) {
      scores[key] = Math.round((cat.score || 0) * 100);
    }
    console.log(`\n  ${C.bold}Lighthouse Scores:${C.reset}\n`);
    const scoreDisplay = (name, score) => {
      const color = score >= 90 ? C.green : score >= 50 ? C.yellow : C.red;
      return `  ${color}${name}: ${score}/100${C.reset}`;
    };
    console.log(scoreDisplay('Performance', scores.performance || 0));
    console.log(scoreDisplay('Accessibility', scores.accessibility || 0));
    console.log(scoreDisplay('Best Practices', scores['best-practices'] || 0));
    console.log(scoreDisplay('SEO', scores.seo || 0));

    // Show failing audits
    const failing = [];
    for (const [key, cat] of Object.entries(lh.categories)) {
      for (const ref of cat.auditRefs) {
        const audit = lh.audits[ref.id];
        if (audit && audit.score !== null && audit.score < 1 && audit.score !== undefined) {
          failing.push({ category: cat.title, id: ref.id, title: audit.title, score: audit.score });
        }
      }
    }
    if (failing.length > 0) {
      console.log(`\n  ${C.yellow}Failing Audits:${C.reset}`);
      failing.forEach(f => console.log(`    ${C.red}✗${C.reset} [${f.category}] ${f.id}: ${f.title}`));
    }
    return scores;
  } catch (e) {
    fail(`Lighthouse failed: ${e.message}`);
    return null;
  }
}

async function checkSEO(html) {
  section('SEO CHECKS');
  let score = 0;
  let total = 0;

  const check = (condition, msg) => {
    total++;
    if (condition) { pass(msg); score++; }
    else fail(msg);
  };

  check(html.includes('<title>') && html.includes('</title>'), 'Has <title> tag');
  check(html.includes('name="description"'), 'Has meta description');
  check(html.includes('name="keywords"'), 'Has meta keywords');
  check(html.includes('rel="canonical"'), 'Has canonical link');
  check(html.includes('name="robots"'), 'Has robots meta tag');
  check(html.includes('property="og:title"'), 'Has Open Graph title');
  check(html.includes('property="og:description"'), 'Has Open Graph description');
  check(html.includes('property="og:image"'), 'Has Open Graph image');
  check(html.includes('property="og:url"'), 'Has Open Graph URL');
  check(html.includes('property="og:site_name"'), 'Has Open Graph site name');
  check(html.includes('name="twitter:card"'), 'Has Twitter Card');
  check(html.includes('name="twitter:title"'), 'Has Twitter title');
  check(html.includes('name="twitter:image"'), 'Has Twitter image');
  check(html.includes('rel="manifest"'), 'Has PWA manifest link');
  check(html.includes('rel="preconnect"'), 'Has font preconnect');
  check(html.includes('application/ld+json'), 'Has structured data (JSON-LD)');
  check(html.includes('"@type": "Organization"') || html.includes('"@type":"Organization"'), 'Has Organization schema');
  check(html.includes('"@type": "WebSite"') || html.includes('"@type":"WebSite"'), 'Has WebSite schema');
  check(html.includes('viewport'), 'Has viewport meta tag');
  check(html.includes('theme-color'), 'Has theme-color meta');
  check(html.includes('apple-touch-icon'), 'Has apple-touch-icon');

  console.log(`\n  ${C.bold}SEO Score: ${score}/${total}${C.reset}`);
  return { score, total };
}

async function checkGEO(html) {
  section('GEO CHECKS (Geographic Optimization)');
  let score = 0;
  let total = 0;

  const check = (condition, msg) => {
    total++;
    if (condition) { pass(msg); score++; }
    else fail(msg);
  };

  check(html.includes('name="geo.region"'), 'Has geo.region meta tag');
  check(html.includes('name="geo.placename"'), 'Has geo.placename meta tag');
  check(html.includes('name="geo.position"'), 'Has geo.position meta tag');
  check(html.includes('name="ICBM"'), 'Has ICBM meta tag (coordinates)');
  check(html.includes('US-IL'), 'Geo region set to US-IL (Illinois)');
  check(html.includes('41.8'), 'Geo coordinates present (latitude)');
  check(html.includes('"areaServed"'), 'Organization schema has areaServed');

  // Check sitemap for geo tags
  try {
    const sitemapRes = await fetch(`${URL}sitemap.xml`);
    if (sitemapRes.status === 200) {
      check(sitemapRes.body.includes('geo:geo') || sitemapRes.body.includes('xmlns:geo'), 'Sitemap has geo namespace');
    } else {
      fail('Sitemap not accessible');
      total++;
    }
  } catch (e) {
    warn('Could not fetch sitemap for geo check');
    total++;
  }

  console.log(`\n  ${C.bold}GEO Score: ${score}/${total}${C.reset}`);
  return { score, total };
}

async function checkAEO(html) {
  section('AEO CHECKS (Answer Engine Optimization)');
  let score = 0;
  let total = 0;

  const check = (condition, msg) => {
    total++;
    if (condition) { pass(msg); score++; }
    else fail(msg);
  };

  check(html.includes('"@type": "FAQPage"') || html.includes('"@type":"FAQPage"'), 'Has FAQPage schema');
  check(html.includes('"@type": "Question"') || html.includes('"@type":"Question"'), 'Has Question schema in FAQ');
  check(html.includes('"@type": "Answer"') || html.includes('"@type":"Answer"'), 'Has Answer schema in FAQ');
  check(html.includes('"@type": "BreadcrumbList"') || html.includes('"@type":"BreadcrumbList"'), 'Has BreadcrumbList schema');
  check(html.includes('"potentialAction"'), 'Has SearchAction schema');
  check(html.includes('"query-input"'), 'SearchAction has query-input');
  check(html.includes('name="description"') && html.split('name="description"')[1]?.length > 50, 'Meta description is substantial');
  check(html.includes('application/ld+json'), 'Has JSON-LD structured data');
  check((html.match(/application\/ld\+json/g) || []).length >= 3, 'Has multiple structured data blocks (3+)');

  // Check for natural language content (AEO favors answer-friendly text)
  const descMatch = html.match(/name="description" content="([^"]+)"/);
  if (descMatch) {
    const desc = descMatch[1];
    check(desc.length > 120, 'Meta description is >120 chars (answer-friendly)');
    check(desc.includes('?') || desc.includes('find') || desc.includes('discover') || desc.includes('connect'), 'Description uses action verbs');
  } else {
    fail('Could not extract meta description');
    total += 2;
  }

  // Count FAQ questions
  const faqCount = (html.match(/"@type":\s*"Question"/g) || []).length;
  check(faqCount >= 4, `FAQ has ${faqCount} questions (need 4+)`);

  console.log(`\n  ${C.bold}AEO Score: ${score}/${total}${C.reset}`);
  return { score, total };
}

async function checkSitemapRobots() {
  section('SITEMAP & ROBOTS');
  let score = 0;
  let total = 0;

  const check = (condition, msg) => {
    total++;
    if (condition) { pass(msg); score++; }
    else fail(msg);
  };

  try {
    const robotsRes = await fetch(`${URL}robots.txt`);
    if (robotsRes.status === 200) {
      pass('robots.txt accessible');
      score++; total++;
      check(robotsRes.body.includes('Sitemap:'), 'robots.txt references sitemap');
      check(robotsRes.body.includes('Allow:'), 'robots.txt allows crawling');
    } else {
      fail(`robots.txt returned ${robotsRes.status}`);
      total += 3;
    }
  } catch (e) {
    fail('Could not fetch robots.txt');
    total += 3;
  }

  try {
    const smRes = await fetch(`${URL}sitemap.xml`);
    if (smRes.status === 200) {
      pass('sitemap.xml accessible');
      score++; total++;
      check(smRes.body.includes('<urlset'), 'Sitemap has valid urlset');
      check(smRes.body.includes('<loc>'), 'Sitemap has URL entries');
      check((smRes.body.match(/<url>/g) || []).length >= 5, 'Sitemap has 5+ URLs');
      check(smRes.body.includes('<changefreq>'), 'Sitemap has changefreq');
      check(smRes.body.includes('<priority>'), 'Sitemap has priority');
    } else {
      fail(`sitemap.xml returned ${smRes.status}`);
      total += 6;
    }
  } catch (e) {
    fail('Could not fetch sitemap.xml');
    total += 6;
  }

  console.log(`\n  ${C.bold}Sitemap/Robots Score: ${score}/${total}${C.reset}`);
  return { score, total };
}

async function main() {
  console.log(`\n${C.bold}${C.cyan}╔══════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║   CarMatch SEO/GEO/AEO Audit                 ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════════╝${C.reset}`);
  console.log(`  URL: ${URL}`);
  console.log(`  Date: ${new Date().toISOString()}`);

  // Create output dir
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Fetch the page
  let html = '';
  try {
    info('Fetching page...');
    const res = await fetch(URL);
    html = res.body;
    if (res.status !== 200) {
      fail(`Page returned HTTP ${res.status}`);
      process.exit(1);
    }
    pass(`Page fetched (${html.length} bytes)`);
  } catch (e) {
    fail(`Failed to fetch page: ${e.message}`);
    process.exit(1);
  }

  // Run all checks
  const lhScores = await runLighthouse();
  const seo = await checkSEO(html);
  const geo = await checkGEO(html);
  const aeo = await checkAEO(html);
  const sitemap = await checkSitemapRobots();

  // Summary
  section('SUMMARY');
  const totalScore = seo.score + geo.score + aeo.score + sitemap.score;
  const totalPossible = seo.total + geo.total + aeo.total + sitemap.total;
  const pct = Math.round((totalScore / totalPossible) * 100);

  console.log(`  SEO:       ${seo.score}/${seo.total}`);
  console.log(`  GEO:       ${geo.score}/${geo.total}`);
  console.log(`  AEO:       ${aeo.score}/${aeo.total}`);
  console.log(`  Sitemap:   ${sitemap.score}/${sitemap.total}`);
  if (lhScores) {
    console.log(`  Lighthouse: P:${lhScores.performance} A:${lhScores.accessibility} BP:${lhScores['best-practices']} SEO:${lhScores.seo}`);
  }
  console.log(`\n  ${C.bold}Overall: ${totalScore}/${totalPossible} (${pct}%)${C.reset}`);

  // Save report
  const report = {
    url: URL,
    date: new Date().toISOString(),
    lighthouse: lhScores,
    seo, geo, aeo, sitemap,
    overall: { score: totalScore, total: totalPossible, percentage: pct },
  };
  fs.writeFileSync(`${OUTPUT_DIR}/seo-report.json`, JSON.stringify(report, null, 2));
  console.log(`\n  Report saved to ${OUTPUT_DIR}/seo-report.json`);

  process.exit(pct >= 80 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
