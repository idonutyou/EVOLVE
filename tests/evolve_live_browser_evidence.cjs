'use strict';

// Read-only evidence capture for the currently published EVOLVE website.
// This file must never click purchase/checkout or modify the public deployment.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = process.env.EVOLVE_TEST_BASE_URL || 'https://idonutyou.github.io/EVOLVE/';
const OUT = path.resolve(process.env.EVOLVE_QA_OUTPUT || 'test-results/evolve-live-evidence');
const VIEWPORTS = [
  { width: 393, height: 852 },
  { width: 320, height: 568 },
  { width: 852, height: 393 }
];
const NAV = [
  { name: 'shop', selector: 'button[aria-label="상점"]:visible, #homeShopTabV601:visible' },
  { name: 'parts', selector: 'button[aria-label="파츠"]:visible, #homeLabTab:visible' },
  { name: 'battle', selector: 'button[aria-label="전투"]:visible, #homeBattleTabV522:visible' },
  { name: 'challenge', selector: 'button[aria-label^="챌린지"]:visible, #homeChallengeShortcutV47:visible, #memoryBtn:visible', optional: true },
  { name: 'codex', selector: 'button[aria-label="도감"]:visible, #codexBtn:visible' },
  // DNA intentionally LAST: the user-facing button navigates to dna-lab.html.
  { name: 'dna', selector: 'button[aria-label="DNA 연구소"]:visible, #homeDnaLabNavV47:visible' }
];
const report = {
  test: 'EVOLVE independently hosted read-only browser evidence',
  target: BASE_URL,
  startedAt: new Date().toISOString(),
  release: null,
  navigation: [],
  viewports: [],
  screenshots: [],
  pageErrors: [],
  consoleErrors: [],
  requestFailures: [],
  httpFailures: [],
  notes: [],
  success: false,
  failure: null,
  failureCategory: null,
  actualDeviceTested: false
};
fs.mkdirSync(OUT, { recursive: true });

function remember(target, value, max = 40) {
  if (target.length < max) target.push(value);
}

async function capture(page, label) {
  const filename = label.replace(/[^a-z0-9_-]/gi, '-') + '.png';
  await page.screenshot({ path: path.join(OUT, filename), fullPage: true, animations: 'disabled', timeout: 20000 });
  report.screenshots.push(filename);
}

function environmentCategory(error) {
  const message = String(error?.stack || error);
  if (/ERR_BLOCKED_BY_ADMINISTRATOR|ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION_REFUSED|ERR_NETWORK_ACCESS_DENIED/i.test(message)) return 'browser_or_network_environment';
  if (/Required navigation control (missing|hidden)/i.test(message)) return 'stale_selector_or_ui_contract';
  if (/TimeoutError|Timeout [0-9]+ms exceeded/i.test(message)) return 'startup_or_navigation_timeout';
  return 'game_or_test_assertion';
}

function attachTelemetry(page) {
  page.on('pageerror', error => {
    remember(report.pageErrors, String(error.message || error));
  });
  page.on('console', message => {
    if (message.type() === 'error') remember(report.consoleErrors, message.text());
  });
  page.on('requestfailed', request => {
    if (!request.url().startsWith('data:')) {
      remember(report.requestFailures, {
        url: request.url().slice(0, 280),
        reason: request.failure()?.errorText || 'unknown',
        type: request.resourceType()
      });
    }
  });
  page.on('response', response => {
    if (response.status() >= 400) {
      remember(report.httpFailures, {
        url: response.url().slice(0, 280),
        status: response.status(),
        type: response.request().resourceType()
      });
    }
  });
}

async function measure(page) {
  return page.evaluate(() => {
    const rectOf = element => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return {
        x: Math.round(box.x), y: Math.round(box.y),
        width: Math.round(box.width), height: Math.round(box.height),
        right: Math.round(box.right), bottom: Math.round(box.bottom)
      };
    };
    const root = document.documentElement;
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: root.scrollWidth,
      horizontalOverflow: Math.max(0, root.scrollWidth - root.clientWidth),
      app: rectOf(document.querySelector('#app')),
      start: rectOf(document.querySelector('#start')),
      nav: rectOf(document.querySelector('#homeTabs')),
      loaderPresent: !!document.querySelector('#webLoader'),
      visibleCanvasCount: [...document.querySelectorAll('canvas')].filter(c => {
        const r = c.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }).length
    };
  });
}

async function openPublishedGame(page) {
  const target = new URL(BASE_URL);
  assert.ok(['http:', 'https:'].includes(target.protocol), 'A browser-accessible HTTP(S) URL is required');
  target.searchParams.set('evolveQA', '1');
  target.searchParams.set('ciEvidence', String(Date.now()));
  const response = await page.goto(target.toString(), {
    waitUntil: 'domcontentloaded', timeout: 120000
  });
  assert.ok(response && response.ok(), 'Published HTML responded with a successful status');
  await page.waitForFunction(() => {
    const nav = document.querySelector('#homeTabs');
    const loader = document.querySelector('#webLoader');
    const hub = window.__EVOLVE_HOME_HUB_V601__;
    const ready = !hub || hub.read?.()?.ready !== false;
    return !!nav && !loader && ready;
  }, null, { timeout: 180000 });

  // The initial splash is cosmetic; clicking it does not purchase or start combat.
  const intro = page.locator('#introSplash');
  if (await intro.count()) {
    await intro.evaluate(element => {
      if (getComputedStyle(element).display !== 'none') element.click();
    });
  }
  const release = await page.evaluate(async () => {
    const endpoint = new URL('version.json', location.href);
    endpoint.searchParams.set('ciEvidence', String(Date.now()));
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) throw new Error('VERSION_HTTP_' + response.status);
    const actual = await response.json();
    return { publishedBuild: actual.build || null, htmlBuild: window.EVOLVE_WEB_CONFIG?.build || null };
  });
  assert.ok(release.publishedBuild, 'Public version.json must provide a build identifier');
  if (release.htmlBuild) {
    assert.equal(release.htmlBuild, release.publishedBuild,
      'Public HTML and version.json disagree; cache/deployment mismatch');
  } else {
    report.notes.push('Inline HTML build metadata unavailable; public version.json checked independently');
  }
  report.release = release;
  await capture(page, '00-initial-home-393x852');
  return release;
}

async function captureNavigation(page) {
  // Current V717 uses visible graphical hit targets layered over older hidden DOM buttons.
  report.visibleNavigation = await page.locator('button[aria-label]:visible').evaluateAll(nodes =>
    nodes.map(node => ({ label: node.getAttribute('aria-label'), className: node.className })).slice(0, 40));
  // Change pages through existing HOME controls only. No purchase or battle execution.
  for (const destination of NAV) {
    const button = page.locator(destination.selector).first();
    const exists = await button.count();
    if (!exists) {
      remember(report.navigation, { name: destination.name, status: 'missing', optional: !!destination.optional });
      if (!destination.optional) throw new Error('Required navigation control missing: ' + destination.selector);
      continue;
    }
    if (!await button.isVisible()) {
      remember(report.navigation, { name: destination.name, status: 'hidden', optional: !!destination.optional });
      if (!destination.optional) throw new Error('Required navigation control hidden: ' + destination.selector);
      continue;
    }
    await button.click({ timeout: 15000 });
    await page.waitForTimeout(350);
    const observed = await page.evaluate(() => {
      const hub = window.__EVOLVE_HOME_HUB_V601__;
      return hub?.read?.()?.page || null;
    });
    await capture(page, 'nav-' + destination.name + '-393x852');
    remember(report.navigation, {
      name: destination.name, status: 'captured', observedPage: observed,
      selector: destination.selector, currentUrl: page.url()
    });
  }
  assert.ok(report.navigation.filter(item => item.status === 'captured').length >= 4,
    'Expected to capture at least four main HOME destinations');
}

async function captureViewports(page) {
  let critical = [];
  for (const size of VIEWPORTS) {
    await page.setViewportSize(size);
    await page.waitForTimeout(300);
    const layout = await measure(page);
    const clippedStart = layout.start && layout.start.height > 0 &&
      (layout.start.y < -3 || layout.start.bottom > layout.viewport.height + 3);
    const clippedNav = layout.nav && layout.nav.height > 0 &&
      (layout.nav.y < -3 || layout.nav.bottom > layout.viewport.height + 3);
    const overflow = layout.horizontalOverflow > 3;
    report.viewports.push({ size, ...layout, clippedStart: !!clippedStart, clippedNav: !!clippedNav, overflow });
    await capture(page, 'viewport-' + size.width + 'x' + size.height);
    if (clippedStart || clippedNav || overflow) {
      critical.push({ size, clippedStart: !!clippedStart, clippedNav: !!clippedNav, overflow });
    }
  }
  await page.setViewportSize(VIEWPORTS[0]);
  assert.deepEqual(critical, [], 'Viewport clipping or horizontal overflow detected');
}

function persistReport() {
  report.finishedAt = new Date().toISOString();
  const filename = path.join(OUT, 'report.json');
  fs.writeFileSync(filename, JSON.stringify(report, null, 2) + '\n');
  const summary = [
    '## EVOLVE independent live browser evidence',
    '',
    '**Result:** ' + (report.success ? 'PASS' : 'FAIL'),
    '',
    '**Public target:** ' + report.target,
    '',
    '**Public build:** ' + (report.release?.publishedBuild || 'unavailable'),
    '',
    '**Screenshots:** ' + report.screenshots.length,
    '',
    '**Page errors:** ' + report.pageErrors.length,
    '',
    '**Failed requests:** ' + report.requestFailures.length,
    '',
    '**Failure category:** ' + (report.failureCategory || 'none'),
    '',
    '**Physical-device testing:** not performed',
    '',
    'Tested the hosted public game. Did not deploy, purchase, or modify player saves.',
    ''
  ].join('\n');
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(summary);
  console.log('RESULT_JSON=' + filename);
}

(async () => {
  let browser;
  let context;
  let page;
  try {
    browser = await chromium.launch({
      executablePath: process.env.CHROME_BIN || undefined,
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader']
    });
    context = await browser.newContext({
      viewport: VIEWPORTS[0],
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
      serviceWorkers: 'block',
      reducedMotion: 'reduce'
    });
    page = await context.newPage();
    attachTelemetry(page);
    await openPublishedGame(page);
    await captureViewports(page);
    await captureNavigation(page);
    assert.deepEqual(report.pageErrors, [], 'Uncaught JavaScript errors in public game');
    assert.deepEqual(report.requestFailures.filter(x => ['document', 'script'].includes(x.type) && !/ERR_ABORTED/.test(x.reason)), [],
      'Required public page or game script request failed');
    assert.deepEqual(report.httpFailures.filter(x => ['document', 'script'].includes(x.type)), [],
      'Required public page or game script returned HTTP error');
    report.success = true;
  } catch (error) {
    report.failure = String(error?.stack || error);
    report.failureCategory = environmentCategory(error);
    console.error(report.failure);
    if (page) {
      try { await capture(page, '99-failure'); }
      catch (captureError) { report.notes.push('Failure screenshot unavailable: ' + captureError.message); }
    }
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    persistReport();
    if (!report.success) process.exitCode = 1;
  }
})();
