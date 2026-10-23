// WEB-18: ordinary campaign progress is separate from developer stage shortcuts.
let evolveAdminEnabledV585=false,evolveAdminTapsV585=0;
const normalProgressKeyV585='EVOLVE_V575_TEST_NORMAL_PROGRESS_V585';
const normalProgressV585=(()=>{try{const p=JSON.parse(localStorage.getItem(normalProgressKeyV585)||'null'),unlocked=Math.max(1,Math.min(99,Math.trunc(Number(p?.unlocked)||1)));return {unlocked,stage:Math.max(1,Math.min(unlocked,Math.trunc(Number(p?.stage)||1)))};}catch(_){return {unlocked:1,stage:1};}})();
function saveNormalProgressV585(){try{localStorage.setItem(normalProgressKeyV585,JSON.stringify({version:1,...normalProgressV585}));}catch(_){}}
