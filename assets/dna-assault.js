(() => {
 'use strict';

 const extent = [864, 1536];
 const stats = [
  { id: 'power', title: '공격력', route: '기초 공격', x: 432, y: 374, icon: [398, 298, 73, 72], desc: '주무기 직접 피해' },
  { id: 'speed', title: '공격속도', route: '공격속도', x: 179, y: 548, icon: [118, 482, 124, 62], desc: '주무기 기본 공격속도' },
  { id: 'range', title: '사거리', route: '사거리', x: 685, y: 548, icon: [645, 468, 80, 77], desc: '기본 공격 사거리' },
  { id: 'rapid', title: '연사', route: '연사 최종 경로', x: 270, y: 800, icon: [231, 726, 81, 68], desc: '2연발 · 한 발당 피해' },
  { id: 'multi', title: '멀티샷', route: '멀티샷 최종 경로', x: 594, y: 800, icon: [553, 721, 82, 70], desc: '2투사체 · 한 발당 피해' }
 ];
 const fieldRects = {
  title: [244, 991, 224, 52], tier: [253, 1053, 109, 22],
  desc: [519, 995, 255, 68], current: [181, 1144, 130, 40],
  next: [522, 1144, 139, 40], nextTier: [715, 1116, 62, 21],
  cost: [358, 1400, 121, 40]
 };
 const cardRects = [[98,1212,129,151],[247,1212,113,151],[382,1212,114,151],[517,1212,114,151],[652,1212,114,151]];
 const speedIds = new Set(['ATK-B04', 'ATK-B09', 'ATK-B15']);

 function percent(value) {
  const sign = value < 0 ? '−' : '+';
  return sign + String(Math.round(Math.abs(value) * 100) / 100) + '%';
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

 function statGlyph(image, [x, y, width, height]) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
  const glyph = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < glyph.data.length; i += 4) {
   const light = Math.min(glyph.data[i+1], glyph.data[i+2]);
   glyph.data[i] = 255;
   glyph.data[i+1] = 242;
   glyph.data[i+2] = 249;
   glyph.data[i+3] = Math.min(255, Math.max(0, (light - 74) * 1.9));
  }
  ctx.putImageData(glyph, 0, 0);
  return 'url(' + canvas.toDataURL() + ')';
 }

 function create({ nodes, rankOf, freeDNA, canBuy, missing, canResearch, art, onBack, onTree, onUpgrade }) {
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
    ...fieldRects, buyLabel: [591, 1398, 113, 37], hero: [118, 1004, 80, 74],
    ...Object.fromEntries(cardRects.flatMap(([x,y,w], i) => [
     [`card${i}`, [x+10,y+68,w-20,77]],
     [`icon${i}`, [x+23,y+14,w-46,57]]
    ]))
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
   card.innerHTML = '<span class="assaultCardGlyph" aria-hidden="true"></span><span class="assaultCardTier"></span><strong></strong><span class="assaultCardState" aria-hidden="true"></span>';
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
   if (selected) {
    mountSurfaces();
    if (!selected.glyph) loadGlyphs();
   }
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

  function renderDetail() {
   const step = selected.steps[selectedStep];
   const { node, rank } = step;
   const owned = rankOf(node.id);
   const done = owned >= rank;
   const eligible = !done && rank === owned + 1 && canBuy(node);
   const isPower = selected.id === 'power';
   fields.title.hidden = isPower;
   setSurface('title', isPower);
   fields.title.textContent = selected.title;
   const hasGlyph = !isPower && selected.glyph;
   setSurface('hero', !hasGlyph);
   hero.hidden = !hasGlyph;
   if (hasGlyph) hero.style.setProperty('--assault-glyph', selected.glyph);
   fields.tier.textContent = `Lv.${selected.nodes.reduce((n,node)=>n+rankOf(node.id),0)} / ${selected.steps.length}`;
   const penalty = selected.id === 'range' && node.note.match(/직접 피해 (-[\d.]+)%p/);
   const description = speedIds.has(node.id) ? '주무기 기본 공격속도' : penalty
    ? `기본 사거리 · 피해 ${penalty[1]}%p` : selected.desc;
   fields.desc.textContent = node.name + '\n' + description;
   fields.desc.title = node.note || node.target;
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
    const nodeRank = rankOf(s.node.id);
    const status = nodeRank >= s.rank ? 'owned' : s.rank === nodeRank + 1 && canBuy(s.node) ? 'ready' : 'locked';
    card.dataset.status = status;
    card.dataset.primary = String(i === 0);
    card.setAttribute('aria-pressed', String(index === selectedStep));
    const statusText = { owned:'완료', ready:'강화 가능', locked:'잠김' }[status];
    const bonus = percent(valueAt(s.node,s.rank));
    const label = `Lv.${index+1} ${s.node.name} ${bonus} · ${statusText}`;
    card.setAttribute('aria-label', label);
    card.title = `${label}, 진화 Lv.${s.level} 이상`;
    card.querySelector('.assaultCardTier').textContent = `Lv.${index+1}`;
    card.querySelector('strong').textContent = bonus;
    card.querySelector('.assaultCardState').textContent = status === 'ready' ? '' : statusText;
    const glyph = card.querySelector('.assaultCardGlyph');
    glyph.hidden = !hasGlyph;
    if (hasGlyph) glyph.style.setProperty('--assault-glyph', selected.glyph);
    setSurface(`icon${i}`, !hasGlyph);
   });
   prev.hidden = firstStep === 0;
   next.hidden = firstStep + cards.length === selected.steps.length;
   buy.disabled = pending || !eligible;
   buy.firstElementChild.textContent = done ? '연구 완료' : eligible ? '' : canResearch() ? '조건 미달' : '저장 조회 불가';
   setSurface('buyLabel', eligible);
   query('.assaultStatus').textContent = !canResearch() ? '진화 연구 저장을 확인할 수 없습니다.' : done ? '' : rank !== owned + 1
    ? `${node.name} Lv.${rank-1} 필요`
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

  function loadGlyphs() {
   if (!selected || mapArt.naturalWidth !== extent[0]) return;
   for (const stat of stats) stat.glyph = statGlyph(mapArt, stat.icon);
   render();
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
  mapArt.addEventListener('load', loadGlyphs);
  if (mapArt.complete) loadGlyphs();
  detailArt.addEventListener('load', () => { mountSurfaces(); render(); });
  back.addEventListener('click', () => {
   if (selected) { selected = null; showDetail(); }
   else onBack();
  });
  query('.assaultAll').addEventListener('click', onTree);
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
   render,
   show() { view.hidden = false; showDetail(); },
   hide() { view.hidden = true; selected = null; }
  };
 }

 window.EVOLVE_DNA_ASSAULT = { create };
})();
