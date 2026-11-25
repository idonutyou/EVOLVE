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
  next: [522, 1144, 139, 40], nextTier: [715, 1116, 62, 21]
 };
 const cardRects = [163, 303, 439, 574, 709].map(x => [x - 61, 1210, 122, 158]);
 const speedIds = new Set(['ATK-B04', 'ATK-B09', 'ATK-B15']);

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
  const prev = query('.assaultPrev');
  const next = query('.assaultNext');
  const back = query('.assaultBack');
  const buy = query('.assaultUpgrade');
  const cost = query('.assaultCost');
  const requirements = query('.assaultRequirements');
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

  const cards = cardRects.map((rect, i) => {
   const card = document.createElement('button');
   card.type = 'button';
   card.className = 'assaultControl assaultStageCard';
   card.innerHTML = '<span class="assaultGlyph assaultCardSymbol" aria-hidden="true"></span><span class="assaultCardTier"></span><strong></strong><span class="assaultGlyph assaultCardLock" aria-hidden="true"></span>';
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
   detail.hidden = !selected;
   back.setAttribute('aria-label', selected ? '공격 계열로 돌아가기' : '연구소로 돌아가기');
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

  function labelForRank(nodeId, rank) {
   for (const stat of stats) {
    const index = stat.steps.findIndex(step => step.node.id === nodeId && step.rank === rank);
    if (index >= 0) return `${stat.title} Lv.${index + 1}`;
   }
   return '공격 계열 선행 연구';
  }

  function renderDetail() {
   const step = selected.steps[selectedStep];
   const { node, rank } = step;
   const owned = rankOf(node.id);
   const status = stageStatus(step, rankOf, canBuy);
   const done = status === 'owned';
   const eligible = status === 'ready';
   detail.dataset.stat = selected.id;
   fields.title.textContent = selected.title;
   fields.tier.textContent = `Lv.${selected.nodes.reduce((n,node)=>n+rankOf(node.id),0)} / ${selected.steps.length}`;
   fields.desc.textContent = selected.desc;
   const [current, nextEffect] = stepEffects(selected,step,rankOf,speedNodes);
   fields.current.textContent = current;
   fields.next.textContent = nextEffect;
   fields.nextTier.textContent = `Lv.${selectedStep + 1}`;
   cost.firstElementChild.textContent = canResearch() ? freeDNA().toLocaleString('ko-KR') : '—';
   cost.lastElementChild.textContent = done ? '/—' : `/${node.dna_cost_by_rank[rank - 1]}`;

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
   buy.firstElementChild.textContent = done ? '연구 완료' : eligible ? '레벨 업' : canResearch() ? '조건 미달' : '저장 조회 불가';
   const unmet = !canResearch() ? [{txt:'저장 조회 불가'}] : done ? [] : missing(node, rank)
    .filter(req => !req.ok && req.kind !== 'dna');
   if (!done && canResearch() && rank > owned + 1) unmet.push({txt:labelForRank(node.id, rank - 1)});
   requirements.replaceChildren(...unmet.map(req => {
    const item = document.createElement('span');
    item.textContent = req.kind === 'evolution' ? req.txt.replace(/ 이상$/, '') : req.txt;
    return item;
   }));
   requirements.hidden = unmet.length === 0;
   requirements.title = unmet.map(req => req.txt).join(' · ');
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
