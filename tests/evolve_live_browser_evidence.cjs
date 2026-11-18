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
  { name: 'shop', selector: '#homeShopTabV601' },
  { name: 'parts', selector: '#homeLabTab' },
  { name: 'battle', selector: '#homeBattleTabV522' },
  { name: 'codex', selector: '#codexBtn' },
  { name: 'challenge', selector: '#memoryBtn', optional: true }
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
  if (/TimeoutError|Timeout [0-9]+ms exceeded/i.test(message)) return 'startup_or_navigation_timeout';
  return 'game_or_test_assertion';
}

// The boot, navigation and reporting routines are added in the next checkpoints.
