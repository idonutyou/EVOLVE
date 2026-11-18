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
  const startupFailure = /EVOLVE_STARTUP_FAILED|TimeoutError|Timeout [0-9]+ms exceeded/i.test(message);
  const decodeFailure = report.pageErrors.some(value => /Unable to decode|Critical asset preloader failure/i.test(value));
  if (startupFailure && decodeFailure && report.httpFailures.some(value => value.status >= 500 && ['image', 'script', 'document'].includes(value.type))) return 'upstream_http_asset_failure';
  if (startupFailure && decodeFailure) return 'asset_decode_failure';
  if (/EVOLVE_STARTUP_FAILED/i.test(message)) return 'game_startup_error';
  if (/ERR_BLOCKED_BY_ADMINISTRATOR|ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION_REFUSED|ERR_NETWORK_ACCESS_DENIED/i.test(message)) return 'browser_or_network_environment';
  if (/Required navigation control (missing|hidden)/i.test(message)) return 'stale_selector_or_ui_contract';
  if (/TimeoutError|Timeout [0-9]+ms exceeded/i.test(message)) return 'startup_or_navigation_timeout';
  return 'game_or_test_assertion';
}

async function waitForStartup(page, ready, label, timeout = 180000) {
  const failure = message => new Error('EVOLVE_STARTUP_FAILED [' + label + ']: ' + message);
  if (report.pageErrors.length) throw failure(report.pageErrors[report.pageErrors.length - 1]);
  let onError;
  const fatal = new Promise((resolve, reject) => {
    onError = error => reject(failure(String(error.message || error)));
    page.on('pageerror', onError);
  });
  try {
    const handle = await Promise.race([page.waitForFunction(ready, null, { timeout }), fatal]);
    await handle.dispose();
  } finally {
    page.off('pageerror', onError);
  }
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

// Optional staged mode extends the established live evidence harness. It serves
// only changed candidate files inside this isolated browser, never to the public.
const CANDIDATE = process.env.EVOLVE_CANDIDATE_DIR ? path.resolve(process.env.EVOLVE_CANDIDATE_DIR) : null;
async function stageCandidate(context) {
  const url = new URL('version.json', BASE_URL); url.searchParams.set('ciEvidence', Date.now());
  const response = await fetch(url, {cache:'no-store'});
  assert.ok(response.ok, 'Real public version.json must be accessible before staged inspection');
  const published = await response.json();
  const expected = process.env.EVOLVE_EXPECT_PUBLIC_BUILD;
  if (expected) assert.equal(published.build, expected, 'Published baseline changed; integrate that version before testing');
  const candidate = JSON.parse(fs.readFileSync(path.join(CANDIDATE,'version.json')));
  report.staged = {publicBuild:published.build,candidateBuild:candidate.build,publicDeployment:false,routeOverrides:[],freshIsolatedStorage:true};
  const manifest = JSON.parse(fs.readFileSync(path.join(CANDIDATE,'asset-manifest.json')));
  const files = new Set(['index.html','version.json','asset-manifest.json','dna-lab.html',...manifest.map(x=>x.path).filter(p=>fs.existsSync(path.join(CANDIDATE,p)))]);
  await context.route('**/*', route => {
    const u=new URL(route.request().url()),base=new URL(BASE_URL);
    if(u.origin!==base.origin||!u.pathname.startsWith(base.pathname))return route.continue();
    const relative=u.pathname.slice(base.pathname.length)||'index.html';
    if(!files.has(relative))return route.continue();
    if(!report.staged.routeOverrides.includes(relative))report.staged.routeOverrides.push(relative);
    const mime=relative.endsWith('.html')?'text/html; charset=utf-8':relative.endsWith('.json')?'application/json':relative.endsWith('.png')?'image/png':'application/octet-stream';
    return route.fulfill({status:200,contentType:mime,body:fs.readFileSync(path.join(CANDIDATE,relative))});
  });
  await context.addInitScript(() => {
    // The established dual-arm regression fixture lives only in this new context.
    const key='EVOLVE_V575_TEST_PARTS_UI_V523';
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({schema:1,worn:{arm:'arm_cannon',back:'back_neural'},filter:'all',sort:'default'}));
  });
}
async function nativeReady(page) {
  await waitForStartup(page,()=>!document.getElementById('webLoader')&&document.getElementById('evolveHeaderUnified')&&!document.getElementById('evolveHeaderUnified').hidden&&window.__EVOLVE_DUAL_ARM_V631__?.snapshot()?.gameRendererConnected,'native UI');
  await page.evaluate(()=>document.getElementById('introSplash')?.click());
}
async function goMain(page,name) {
  await page.locator('button[aria-label="'+{shop:'상점',parts:'파츠',battle:'전투',codex:'도감'}[name]+'"]:visible').first().click();
  await page.waitForFunction(name=>document.getElementById('poster')?.dataset.homePage===name,name);
  await page.waitForTimeout(200);
}
async function commonLayout(page,name) {
  return page.evaluate(name=>{
    const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
    const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none'};
    const header=document.querySelector('#evolveHeaderUnified');
    const footer=[...document.querySelectorAll(name==='battle'?'.evolveRefTab':'.labChromeTab')].filter(visible);
    const details=['.evolveHeaderArt','.evolveHeaderName','.evolveHeaderLevel','.evolveHeaderXp','.evolveHeaderDna','.evolveHeaderPremium','.evolveHeaderHit.avatar','.evolveHeaderHit.settings'];
    const result={page:name,viewport:{width:innerWidth,height:innerHeight},header:rect(header),headerElements:details.map(s=>rect(header?.querySelector(s))),footer:footer.map(rect),icons:footer.map(b=>{const images=[...b.querySelectorAll('.evolveFooterOriginal')];return {count:images.length,loaded:images.every(i=>i.complete&&i.naturalWidth>0),svg:b.querySelectorAll('.evolveFooterIcon svg').length}}),horizontalOverflow:Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth)};
    if(name==='parts'){
      const upper=document.querySelector('.partsUpperV723'),host=document.querySelector('#homePartsViewV523');
      result.upperRatio=upper.getBoundingClientRect().width/host.getBoundingClientRect().width;
      result.slots=['partsLeftSlotsV523','partsRightSlotsV523'].map(id=>[...document.getElementById(id).querySelectorAll('.partsSlotV523')].map(rect));
      result.specimenFit=getComputedStyle(document.getElementById('partsSpecimenImgV523')).objectFit;
    }
    if(name==='shop')result.titleBandHidden=getComputedStyle(document.querySelector('.shopRefTop')).display==='none';
    if(name==='codex')result.titleBandHidden=getComputedStyle(document.querySelector('.codexTop')).display==='none';
    return result;
  },name);
}
function assertCommonLayout(actual,expected) {
  assert.ok(actual.horizontalOverflow<2,'Horizontal overflow: '+JSON.stringify(actual));
  assert.equal(actual.footer.length,5,'Exactly five shared footer buttons');
  actual.footer.forEach(r=>assert.ok(Math.abs(r.bottom-actual.viewport.height)<1.1,'Footer must touch the bottom: '+JSON.stringify(r)));
  assert.ok(actual.icons.every(x=>x.count===1&&x.loaded&&x.svg===0),'Original raster icon once per button');
  if(expected)for(const key of ['header','headerElements','footer']){
    const a=Array.isArray(actual[key])?actual[key]:[actual[key]],b=Array.isArray(expected[key])?expected[key]:[expected[key]];
    a.forEach((r,i)=>{assert.ok(r&&b[i],'Missing common UI '+key);for(const k of ['x','y','width','height'])assert.ok(Math.abs(r[k]-b[i][k])<1.1,'Common UI differs '+actual.page+' '+key+' '+i+' '+k+': '+r[k]+' vs '+b[i][k])});
  }
  if(actual.page==='parts'){
    assert.ok(Math.abs(actual.upperRatio-.8)<.003,'Parts upper group should be 80% of full width');
    assert.equal(actual.specimenFit,'contain');
    actual.slots.forEach(column=>{assert.equal(column.length,3);assert.ok(column.every(s=>Math.abs(s.x-column[0].x)<.2),'Three slots must form a straight column');assert.ok(Math.abs((column[1].y-column[0].y)-(column[2].y-column[1].y))<.3,'Even vertical spacing')});
    actual.slots[0].forEach((r,i)=>assert.ok(Math.abs(r.y-actual.slots[1][i].y)<.3,'Left and right rows align'));
  }
  if('titleBandHidden'in actual)assert.ok(actual.titleBandHidden,'Printed page title still visible');
}
async function equipIndependentArms(page) {
  const before=await page.evaluate(()=>window.__EVOLVE_DUAL_ARM_V631__.snapshot());
  assert.equal(before.arm1,'arm_cannon','Fixture/legacy main arm migration lost');
  assert.equal(before.legacyBack,'back_neural','Legacy back must survive migration');
  // DNA return navigation intentionally does not carry evolveQA=1. Exercise
  // the native inventory/detail controls rather than the query-gated test API.
  await page.locator('.partsRefOverallFilter').selectOption('arm');
  await page.locator('#partsGridV523 button[data-part-id="arm_blades"][data-arm-variant-v656="arm2"]').click();
  await page.locator('#partsDetail_arm2_V631').click();
  await page.waitForFunction(()=>window.__EVOLVE_DUAL_ARM_V631__.snapshot().arm2==='arm_blades');
  const after=await page.evaluate(()=>window.__EVOLVE_DUAL_ARM_V631__.snapshot());
  assert.equal(after.arm1,'arm_cannon','Equipping the sub arm must preserve the main arm');
  assert.equal(after.arm2,'arm_blades','Native sub arm equip must succeed');
  assert.equal(after.legacyBack,'back_neural','Native arm equip must preserve legacy back');
  return {before,after};
}
async function inspectCandidate(page) {
  report.candidateChecks=[];report.layouts=[];report.dnaScroll=[];
  await nativeReady(page);
  for(const size of VIEWPORTS){
    await page.setViewportSize(size);await page.waitForTimeout(200);let expected;
    for(const name of ['shop','parts','battle','codex']){
      await goMain(page,name);const layout=await commonLayout(page,name);report.layouts.push({size,...layout});assertCommonLayout(layout,expected);expected=expected||layout;
      await capture(page,'candidate-'+name+'-'+size.width+'x'+size.height);
    }
    await page.locator('button[aria-label="DNA 연구소"]:visible').first().click();
    await page.waitForURL('**/dna-lab.html');
    await page.waitForFunction(()=>document.documentElement.classList.contains('dnaRefReady')&&document.querySelector('#dnaCommonFrame .evolveHeaderArt')?.complete);
    const layout=await commonLayout(page,'dna');report.layouts.push({size,...layout});assertCommonLayout(layout,expected);
    const dnaScroll=await page.evaluate(()=>{
      const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,display:s.display,visibility:s.visibility,overflowY:s.overflowY}};
      const root=document.scrollingElement,before=scrollY;window.scrollTo(0,root.scrollHeight);const attemptedScrollY=scrollY;window.scrollTo(0,before);
      return {viewport:{width:innerWidth,height:innerHeight},scrollHeight:root.scrollHeight,clientHeight:root.clientHeight,attemptedScrollY,html:rect(document.documentElement),body:rect(document.body),legacyApp:rect(document.querySelector('body>.app')),hub:rect(document.querySelector('#hubView')),skin:rect(document.querySelector('#dnaRefSkin')),board:rect(document.querySelector('#dnaRefBoard'))};
    });
    report.dnaScroll.push(dnaScroll);
    assert.ok(dnaScroll.scrollHeight<=dnaScroll.clientHeight+1,'DNA hub must not create document overflow: '+JSON.stringify(dnaScroll));
    assert.ok(dnaScroll.attemptedScrollY<=1,'DNA hub must not scroll into a blank lower area');
    assert.equal(await page.locator('#dnaRefOrbs button').count(),7,'All original DNA branches remain available');
    await capture(page,'candidate-dna-'+size.width+'x'+size.height);
    await page.locator('button[aria-label="전투"]:visible').click();await nativeReady(page);
  }
  report.candidateChecks.push('Five pages share header/footer geometry at all three viewports; bottom gap zero, original raster glyphs loaded once, parts 80% group and aligned six slots');
  await page.setViewportSize(VIEWPORTS[0]);await goMain(page,'parts');
  const filter=page.locator('#partsFiltersV523 [data-filter="head"]');await filter.click();
  assert.equal(await page.locator('.partsRefOverallFilter').inputValue(),'head','Native filter and visible dropdown remain synchronized');
  await page.locator('.partsRefOverallFilter').selectOption('all');
  const sortBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('EVOLVE_V575_TEST_PARTS_UI_V523')||'{}').sort);
  const requestedSort=sortBefore==='rank'?'name':'rank';
  await page.locator('#partsSortV523').selectOption(requestedSort);
  await page.waitForFunction(expected=>JSON.parse(localStorage.getItem('EVOLVE_V575_TEST_PARTS_UI_V523')||'{}').sort===expected,requestedSort);
  const sortAfter=await page.evaluate(()=>JSON.parse(localStorage.getItem('EVOLVE_V575_TEST_PARTS_UI_V523')||'{}').sort);
  assert.notEqual(sortAfter,sortBefore,'Native sort button must still change the persisted selection');
  assert.equal(sortAfter,requestedSort,'Native sort select persists the chosen option');
  const equipped=await equipIndependentArms(page);
  assert.equal(equipped.after.arm1,'arm_cannon');assert.equal(equipped.after.arm2,'arm_blades');
  await capture(page,'candidate-native-parts-equipped');
  await page.reload({waitUntil:'domcontentloaded'});await nativeReady(page);await goMain(page,'parts');
  const restored=await page.evaluate(()=>window.__EVOLVE_DUAL_ARM_V631__.snapshot());
  assert.equal(restored.arm1,'arm_cannon');assert.equal(restored.arm2,'arm_blades');assert.equal(restored.legacyBack,'back_neural');
  assert.equal(await page.locator('#partsSortV523').inputValue(),requestedSort,'Native sort choice must survive reload');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('EVOLVE_V575_TEST_PARTS_UI_V523')||'{}').sort),requestedSort,'Persisted sort must survive reload');
  report.equipment={equipped,restored,sortBefore,sortAfter};report.candidateChecks.push('Native filter/sort work; independent arms and hidden legacy back survive reload in isolated fixture');
  await page.locator('#evolveHeaderUnified .evolveHeaderHit.settings').click();
  await page.locator('#settingsOverlay').waitFor({state:'visible'});
  const recorder=page.locator('#settingsPanel > #gp05QAControlsV662');
  await recorder.waitFor({state:'visible'});
  assert.equal(await page.locator('#gp05QAControlsV662').count(),1,'Retain exactly one original recorder control');
  await recorder.locator(':scope > button').click();
  await page.getByRole('button',{name:'전체 플레이 기록 받기',exact:true}).waitFor({state:'visible'});
  report.recorder=await page.evaluate(()=>({inSettings:document.getElementById('gp05QAControlsV662')?.parentElement?.id==='settingsPanel',recording:window.__EVOLVE_GP05_QA_V662__?.isRecording(),exportAvailable:typeof window.__EVOLVE_AUTO_RECORD_V665__?.downloadAll==='function'}));
  assert.ok(report.recorder.inSettings&&report.recorder.recording&&report.recorder.exportAvailable,'Original recording and export must remain available');
  await capture(page,'candidate-native-settings');await page.locator('#settingsClose').click();
  await goMain(page,'codex');await page.locator('.dex01Grid button').first().click();
  await page.locator('.dex01Detail').first().waitFor({state:'visible'});await capture(page,'candidate-native-codex-detail');
  await page.locator('.dex01Close:visible,.dex01Done:visible').first().click();
  const chromeBefore=await page.locator('#evolveHeaderUnified').innerText();
  await page.locator('button[aria-label="DNA 연구소"]:visible').first().click();await page.waitForURL('**/dna-lab.html');
  await page.waitForFunction(()=>document.documentElement.classList.contains('dnaRefReady'));
  assert.equal((await page.locator('#evolveHeaderUnified').innerText()).replace(/\s/g,''),chromeBefore.replace(/\s/g,''),'DNA header must use actual game display values');
  await page.locator('[data-ref-branch="WPN"]').click();assert.equal(await page.locator('[data-ref-branch="WPN"]').getAttribute('aria-pressed'),'true');
  await page.locator('.dnaRefEnter').click();await page.locator('#branchView.active').waitFor({state:'visible'});await capture(page,'candidate-dna-branch');
  await page.locator('#backBtn').click();await page.locator('#hubView.active').waitFor({state:'attached'});
  await page.locator('#evolveHeaderUnified .evolveHeaderHit.settings').click();await nativeReady(page);await page.locator('#settingsOverlay').waitFor({state:'visible'});await page.locator('#settingsClose').click();
  report.candidateChecks.push('Native settings and codex detail open/close; DNA actual header values, original branch selection/detail/back and settings return work');
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
  await waitForStartup(page, () => {
    const nav = document.querySelector('#homeTabs');
    const loader = document.querySelector('#webLoader');
    const hub = window.__EVOLVE_HOME_HUB_V601__;
    const ready = !hub || hub.read?.()?.ready !== false;
    return !!nav && !loader && ready;
  }, 'HOME');

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
    CANDIDATE ? 'Staged candidate in isolated browser; original public assets reused. Test fixture only; no production deployment or user saves touched.' : 'Tested the hosted public game. Did not deploy, purchase, or modify player saves.',
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
    if (CANDIDATE) await stageCandidate(context);
    page = await context.newPage();
    attachTelemetry(page);
    await openPublishedGame(page);
    if(CANDIDATE) await inspectCandidate(page);
    else { await captureViewports(page); await captureNavigation(page); }
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

