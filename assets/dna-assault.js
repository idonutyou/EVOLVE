(() => {
 'use strict';

 const extent = [864, 1536];
 const stats = [
  { id: 'power', title: '공격력', route: '기초 공격', x: 432, y: 374, desc: '공격력을 증가시켜 더 강한 피해를 입힙니다.' },
  { id: 'speed', title: '공격속도', route: '공격속도', x: 179, y: 548, desc: '공격속도를 높여 더 빠르게 공격합니다.' },
  { id: 'range', title: '사거리', route: '사거리', x: 685, y: 548, desc: '사거리를 늘려 더 먼 적을 공격합니다.' },
  { id: 'rapid', title: '연사', route: '연사 최종 경로', x: 270, y: 800, desc: '탄환을 연속으로 발사합니다.' },
  { id: 'multi', title: '멀티샷', route: '멀티샷 최종 경로', x: 594, y: 800, desc: '한 번에 여러 탄환을 발사합니다.' }
 ];
 const fieldRects = {
  title: [244, 991, 224, 52], tier: [253, 1053, 109, 22],
  desc: [519, 995, 255, 68], current: [181, 1144, 130, 40],
  next: [522, 1144, 139, 40], nextTier: [715, 1116, 62, 21],
  cost: [358, 1400, 121, 40]
 };
 const cardRects = [163, 303, 439, 574, 709].map(x => [x - 57, 1212, 114, 151]);
 const speedIds = new Set(['ATK-B04', 'ATK-B09', 'ATK-B15']);
 const symbols = {
  power: '<path d="m23 33 24-24 12-4-4 12-24 24-3-3 23-23 1-3-3 1-23 23zM18 32l15 15-3 3-6-6-13 13-5-5 13-13-4-4z" fill="currentColor"/>',
  speed: '<path d="M8 18h8l14 14-14 14H8l14-14z" fill="currentColor" opacity=".55"/><path d="M24 18h8l14 14-14 14h-8l14-14zm16 0h8l14 14-14 14h-8l14-14z" fill="currentColor"/><path d="M2 25h13l4 4H0zm0 14h13l4-4H0z" fill="currentColor" opacity=".35"/>',
  range: '<circle cx="32" cy="32" r="21" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 5v13m0 28v13M5 32h13m28 0h13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="32" r="3.5" fill="currentColor"/>',
  rapid: '<path d="m4 48 3-6 7 4-3 6zm5-9 8-15 7 4-8 15zm9-17 11-8-4 12zM20 49l3-6 8 4-4 6zm5-9 8-15 8 4-9 15zm9-17 11-8-4 12zm3 26 3-6 7 4-3 6zm5-9 8-15 7 4-8 15zm9-17 11-8-4 12z" fill="currentColor"/>',
  multi: '<path d="m5 39 27-24 4 7zm28-27 16-5-10 14zM8 46l34-15 2 8zm35-18 17 1-15 9zM9 51l35-5-1 7zm36-7 15 7-16 4z" fill="currentColor"/>',
  lock: '<path fill="currentColor" fill-rule="evenodd" d="M16 27v-7a16 16 0 0 1 32 0v7h3a5 5 0 0 1 5 5v23a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5V32a5 5 0 0 1 5-5zm6 0h20v-7a10 10 0 0 0-20 0zm10 10a5 5 0 0 0-2.5 9.3V52h5v-5.7A5 5 0 0 0 32 37z"/>'
 };

 function symbolMarkup(id, className) {
  return `<svg class="${className}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${symbols[id]}</svg>`;
 }

 function percent(value) {
  const sign = value < 0 ? '−' : '+';
  return sign + String(Math.round(Math.abs(value) * 100) / 100) + '%';
 }

 function stageStatus(step, rankOf, canBuy) {
  const owned = rankOf(step.node.id);
  if (owned >= step.rank) return 'owned';
  return step.rank === owned + 1 && canBuy(step.node) ? 'ready' : 'locked';
 }

 function valueAt(node, rank) {
  if (!rank) return 0;
  const value = node.effect_values_cumulative[rank - 1];
  return node.effect_metric === 'virtual_attack_points' ? value * .25 : value;
 }

 function stepEffects(stat, step, rankOf, speedNodes) {
  const {node, rank} = step;
  const owned = rankOf(node.id);
  if (stat.id === 'rapid' || stat.id === 'multi') {
   const unlocked = stat.nodes.findLast(n => rankOf(n.id) > 0);
   const current = unlocked ? percent(valueAt(unlocked,rankOf(unlocked.id))) : '미해금';
   return [current, owned >= rank ? current : percent(valueAt(node,rank))];
  }
  const speed = stat.id === 'speed' || speedIds.has(node.id);
  const relevant = speed ? speedNodes : stat.nodes.filter(n => !speedIds.has(n.id));
  const current = relevant.reduce((sum,n) => sum + valueAt(n,rankOf(n.id)), 0);
  const next = current + valueAt(node, Math.max(owned, rank)) - valueAt(node, owned);
  return [percent(current), percent(next)];
 }

 function create({ nodes, rankOf, freeDNA, canBuy, missing, canResearch, art, onBack, onUpgrade }) {
  const view = document.querySelector('#assaultView');
  const query = selector => view.querySelector(selector);
  const buttons = new Map();
  const speedNodes = nodes.filter(n => n.branch === 'ATK' &&
   (n.effect_metric === 'attack_speed_pct' || speedIds.has(n.id)));
  const detail = query('.assaultDetail');
  const detailArt = query('.assaultDetailArt');
  const mapArt = query('.assaultMapArt');
  const hero = query('.assaultHeroGlyph');
  const prev = query('.assaultPrev');
  const next = query('.assaultNext');
  const back = query('.assaultBack');
  const buy = query('.assaultUpgrade');
  const fields = {};
  let selected = null;
  let selectedStep = 0;
  let firstStep = 0;
  let swipeStart = null;
  let ignoreNextCardClick = false;
  let pending = false;

  Object.entries(fieldRects).forEach(([name, rect]) => {
   fields[name] = query(`[data-field="${name}"]`);
   art.placeMatchedSurface(fields[name], rect, extent);
  });

  function mountSurfaces() {
   if (!selected) return;
   const holder = query('.assaultSurfaces');
   if (holder.childElementCount || detailArt.naturalWidth !== extent[0]) return;
   const areas = {
    ...fieldRects, buyLabel: [591, 1398, 113, 37], cards: [75, 1197, 714, 185]
   };
   for (const [name, rect] of Object.entries(areas)) {
    const surface = art.makeMatchedSurface(detailArt, rect, 4);
    surface.className = 'assaultSurface';
    surface.dataset.surface = name;
    art.placeMatchedSurface(surface, rect, extent);
    holder.append(surface);
   }
  }

  const cards = cardRects.map((rect, i) => {
   const card = document.createElement('button');
   card.type = 'button';
   card.className = 'assaultControl assaultStageCard';
   card.innerHTML = '<span class="assaultCardSymbol" aria-hidden="true"></span><span class="assaultCardTier"></span><strong></strong>' + symbolMarkup('lock', 'assaultCardLock');
   art.placeMatchedSurface(card, rect, extent);
   card.addEventListener('click', () => {
    if (ignoreNextCardClick) return;
    selectedStep = firstStep + i;
    render();
   });
   query('.assaultRanks').append(card);
   return card;
  });

  for (const stat of stats) {
   stat.nodes = nodes.filter(n => n.branch === 'ATK' && n.route === stat.route);
   stat.steps = stat.nodes.flatMap(node => node.evolution_level_by_rank.map((level,i) => ({ node, rank:i+1, level })))
    .sort((a,b)=>a.level-b.level);
   const b = document.createElement('button');
   b.type = 'button';
   b.className = 'assaultControl assaultStat';
   b.dataset.stat = stat.id;
   b.setAttribute('aria-controls', 'assaultDetail');
   b.style.setProperty('--x', `${stat.x / extent[0] * 100}%`);
   b.style.setProperty('--y', `${stat.y / extent[1] * 100}%`);
   const level = document.createElement('span');
   level.className = 'assaultRankLabel';
   level.setAttribute('aria-hidden', 'true');
   b.append(level);
   b.addEventListener('click', () => {
    selected = stat;
    const unowned = stat.steps.findIndex(s => rankOf(s.node.id) < s.rank);
    selectedStep = unowned < 0 ? stat.steps.length - 1 : unowned;
    showStep(selectedStep);
    showDetail();
   });
   query('.assaultStats').append(b);
   buttons.set(stat, { b, level });
  }

  function showDetail() {
   detailArt.hidden = detail.hidden = !selected;
   mapArt.hidden = !!selected;
   back.setAttribute('aria-label', selected ? '공격 계열로 돌아가기' : '연구소로 돌아가기');
   if (selected) mountSurfaces();
   render();
  }

  function showStep(index) {
   firstStep = Math.min(Math.floor(index / cards.length) * cards.length, selected.steps.length - cards.length);
   selectedStep = index;
  }

  function flipPage(direction) {
   if (!selected) return;
   const limit = selected.steps.length - cards.length;
   firstStep = direction > 0
    ? Math.min(firstStep + cards.length, limit)
    : Math.max(0, (Math.ceil(firstStep / cards.length) - 1) * cards.length);
   selectedStep = firstStep;
   render();
  }

  function setSurface(name, hidden) {
   query(`[data-surface="${name}"]`)?.toggleAttribute('hidden', hidden);
  }

  function labelForRank(nodeId, rank) {
   for (const stat of stats) {
    const index = stat.steps.findIndex(step => step.node.id === nodeId && step.rank === rank);
    if (index >= 0) return `${stat.title} Lv.${index + 1}`;
   }
   return '공격 계열 선행 연구';
  }

  function renderSymbols(stat) {
   if (detail.dataset.stat === stat.id) return;
   detail.dataset.stat = stat.id;
   hero.hidden = stat.id === 'power';
   hero.innerHTML = hero.hidden ? '' : symbolMarkup(stat.id, 'assaultHeroSymbol');
   for (const card of cards) {
    card.querySelector('.assaultCardSymbol').innerHTML = symbolMarkup(stat.id, 'assaultCardIcon');
   }
  }

  function renderDetail() {
   const step = selected.steps[selectedStep];
   const { node, rank } = step;
   const owned = rankOf(node.id);
   const status = stageStatus(step, rankOf, canBuy);
   const done = status === 'owned';
   const eligible = status === 'ready';
   const isPower = selected.id === 'power';
   renderSymbols(selected);
   fields.title.hidden = isPower;
   setSurface('title', isPower);
   fields.title.textContent = selected.title;
   fields.tier.textContent = `Lv.${selected.nodes.reduce((n,node)=>n+rankOf(node.id),0)} / ${selected.steps.length}`;
   fields.desc.textContent = selected.desc;
   const [current, nextEffect] = stepEffects(selected,step,rankOf,speedNodes);
   fields.current.textContent = current;
   fields.next.textContent = nextEffect;
   fields.nextTier.textContent = `Lv.${selectedStep + 1}`;
   fields.cost.textContent = '';
   const available = document.createElement('b');
   available.textContent = canResearch() ? freeDNA().toLocaleString('ko-KR') : '—';
   fields.cost.append(available, document.createTextNode(done ? ' / —' : ` / ${node.dna_cost_by_rank[rank-1]}`));

   cards.forEach((card,i) => {
    const index = firstStep + i;
    const s = selected.steps[index];
    const status = stageStatus(s, rankOf, canBuy);
    card.dataset.status = status;
    card.setAttribute('aria-pressed', String(index === selectedStep));
    const statusText = { owned:'강화 완료', ready:'강화 가능', locked:'강화 조건 미달' }[status];
    const bonus = percent(valueAt(s.node,s.rank));
    const label = `${selected.title} Lv.${index+1}, ${bonus} · ${statusText}`;
    card.setAttribute('aria-label', label);
    card.title = `${label}, 진화 Lv.${s.level} 이상`;
    card.querySelector('.assaultCardTier').textContent = `Lv.${index+1}`;
    card.querySelector('strong').textContent = bonus;
    card.querySelector('.assaultCardLock').toggleAttribute('data-visible', status === 'locked');
   });
   prev.hidden = firstStep === 0;
   next.hidden = firstStep + cards.length === selected.steps.length;
   buy.disabled = pending || !eligible;
   buy.firstElementChild.textContent = done ? '연구 완료' : eligible ? '' : canResearch() ? '조건 미달' : '저장 조회 불가';
   setSurface('buyLabel', eligible);
   query('.assaultStatus').textContent = !canResearch() ? '진화 연구 저장을 확인할 수 없습니다.' : done ? '' : rank !== owned + 1
    ? `${labelForRank(node.id, rank - 1)} 필요`
    : missing(node).filter(req=>!req.ok).map(req=>req.txt).join(' · ');
   query('.assaultStatus').title = query('.assaultStatus').textContent;
  }

  function render() {
   for (const [stat, { b, level }] of buttons) {
    const rank = stat.nodes.reduce((n, node) => n + rankOf(node.id), 0);
    level.textContent = rank ? `Lv.${rank}` : '';
    b.setAttribute('aria-label', `${stat.title} 상세 연구, Lv.${rank}`);
    b.setAttribute('aria-pressed', String(selected === stat));
   }
   if (selected) renderDetail();
  }

  prev.addEventListener('click', () => flipPage(-1));
  next.addEventListener('click', () => flipPage(1));
  const row = query('.assaultRanks');
  row.addEventListener('pointerdown', event => { swipeStart = event.clientX; });
  row.addEventListener('pointerup', event => {
   if (swipeStart === null) return;
   const dx = event.clientX - swipeStart;
   swipeStart = null;
   if (Math.abs(dx) < 36) return;
   ignoreNextCardClick = true;
   flipPage(dx < 0 ? 1 : -1);
   setTimeout(() => { ignoreNextCardClick = false; }, 0);
  });
  row.addEventListener('pointercancel', () => { swipeStart = null; });
  row.addEventListener('keydown', event => {
   if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
   event.preventDefault();
   flipPage(event.key === 'ArrowRight' ? 1 : -1);
  });
  detailArt.addEventListener('load', () => { mountSurfaces(); render(); });
  back.addEventListener('click', () => {
   if (selected) { selected = null; showDetail(); }
   else onBack();
  });
  buy.addEventListener('click', async () => {
   if (!selected || pending || buy.disabled) return;
   const stat = selected;
   const step = selectedStep;
   const { node, rank } = stat.steps[step];
   pending = true;
   buy.disabled = true;
   try {
    const bought = await onUpgrade(node,rank);
    if (bought && selected === stat && selectedStep === step) {
     const unowned = stat.steps.findIndex(s => rankOf(s.node.id) < s.rank);
     if (unowned >= 0) showStep(unowned);
    }
   } finally {
    pending = false;
    render();
   }
  });

  return {
   labelForRank,
   render,
   show() { view.hidden = false; showDetail(); },
   hide() { view.hidden = true; selected = null; }
  };
 }

 window.EVOLVE_DNA_ASSAULT = { create };
})();
