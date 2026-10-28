/* EVOLVE M07 policy correction: pure Korean calendar-month dates for PAID season passes only.
   No real purchase, entitlement grant, clock read, storage access, or game integration. */
'use strict';
const KST_OFFSET_MS=9*60*60*1000;
function parseMonth(month){
 if(typeof month!=='string'||!/^20[0-9]{2}-(0[1-9]|1[0-2])$/.test(month))throw new TypeError('M07_MONTH_YYYY_MM_REQUIRED');
 const year=Number(month.slice(0,4)),number=Number(month.slice(5));
 return {year,number};
}
function paidMonthWindow(month){
 const {year,number}=parseMonth(month);
 const startMs=Date.UTC(year,number-1,1)-KST_OFFSET_MS;
 const endMs=Date.UTC(year,number,1)-KST_OFFSET_MS;
 const days=(endMs-startMs)/86400000;
 const nextYear=number===12?year+1:year,nextMonth=number===12?1:number+1;
 const nextMonthKey=String(nextYear).padStart(4,'0')+'-'+String(nextMonth).padStart(2,'0');
 return Object.freeze({month,periodType:'PAID_CALENDAR_MONTH_KST',timezone:'Asia/Seoul',startUtc:new Date(startMs).toISOString(),endExclusiveUtc:new Date(endMs).toISOString(),days,
 startLocal:month+'-01T00:00:00+09:00',endExclusiveLocal:nextMonthKey+'-01T00:00:00+09:00',autoRenew:false,checkoutEnabled:false});
}
function isWithinPaidMonth(month,verifiedUtc){
 if(typeof verifiedUtc!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(verifiedUtc))throw new TypeError('M07_VERIFIED_UTC_ISO_REQUIRED');
 const timestamp=Date.parse(verifiedUtc);
 if(!Number.isFinite(timestamp)||new Date(timestamp).toISOString()!==verifiedUtc)throw new TypeError('M07_INVALID_VERIFIED_TIME');
 const w=paidMonthWindow(month);
 return timestamp>=Date.parse(w.startUtc)&&timestamp<Date.parse(w.endExclusiveUtc);
}
module.exports=Object.freeze({paidMonthWindow,isWithinPaidMonth,mode:'PLANNING_ONLY_PAID_MONTH_KST',checkoutEnabled:false});
