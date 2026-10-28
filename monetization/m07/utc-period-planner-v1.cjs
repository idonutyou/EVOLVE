/* EVOLVE M07 20% pure UTC date/quota planner. No browser storage, grants, checkout, or game hooks. */
'use strict';
const DAYS=28,DAY_MS=86400000;
function parseIsoUtc(text){
 if(typeof text!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.000Z$/.test(text))throw new TypeError('M07_CANONICAL_UTC_REQUIRED');
 const d=new Date(text);
 if(!Number.isFinite(d.getTime())||d.toISOString()!==text)throw new RangeError('M07_INVALID_UTC_DATE');
 return d;
}
function dayKey(text){return parseIsoUtc(text).toISOString().slice(0,10);}
function mondayKey(text){
 const d=parseIsoUtc(text),day=d.getUTCDay();
 d.setUTCHours(0,0,0,0);
 d.setUTCDate(d.getUTCDate()-((day+6)%7));
 return d.toISOString().slice(0,10);
}
function seasonWindow(startUtc,days=DAYS){
 const d=parseIsoUtc(startUtc);
 if(d.getUTCHours()||d.getUTCMinutes()||d.getUTCSeconds()||d.getUTCMilliseconds())throw new RangeError('M07_SEASON_START_MIDNIGHT_UTC_REQUIRED');
 if(!Number.isSafeInteger(days)||days<1||days>366)throw new RangeError('M07_SEASON_DAYS_INVALID');
 const end=new Date(d.getTime()+days*DAY_MS);
 return Object.freeze({startUtc,endUtc:end.toISOString(),days});
}
function quotaProposal(startUtc,days=DAYS){
 const {startUtc:begin,endUtc}=seasonWindow(startUtc,days);
 const weeks=new Set();
 for(let i=0;i<days;i++)weeks.add(mondayKey(new Date(Date.parse(begin)+i*DAY_MS).toISOString()));
 const theoreticalFreePoints=2*days+weeks.size;
 return Object.freeze({startUtc:begin,endUtc,utcDays:days,utcWeeks:weeks.size,dailyTasksPerUtcDay:2,weeklyTasksPerUtcWeek:1,theoreticalFreePoints,actualRewardGrants:0,checkoutEnabled:false});
}
function candidatePeriod(cadence,serverVerifiedIsoUtc,startUtc,days=DAYS){
 const d=parseIsoUtc(serverVerifiedIsoUtc),window=seasonWindow(startUtc,days);
 const time=d.getTime(),start=Date.parse(window.startUtc),end=Date.parse(window.endUtc);
 if(time<start||time>=end)return null;
 if(cadence==='daily')return dayKey(serverVerifiedIsoUtc);
 if(cadence==='weekly')return mondayKey(serverVerifiedIsoUtc);
 throw new RangeError('M07_UNKNOWN_CADENCE');
}
function id(v){if(typeof v!=='string'||!/^[A-Za-z0-9_-]{3,72}$/.test(v))throw new TypeError('M07_ID_INVALID');return v;}
function eventDedupe({seasonId,accountId,missionId,eventId}){
 return [seasonId,accountId,missionId,eventId].map(id).join('|');
}
function completionDedupe({seasonId,accountId,missionId,periodKey}){
 if(typeof periodKey!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(periodKey))throw new TypeError('M07_PERIOD_INVALID');
 return [seasonId,accountId,missionId].map(id).concat(periodKey).join('|');
}
function claimDedupe({seasonId,accountId,rewardId}){
 return [seasonId,accountId,rewardId].map(id).join('|');
}
module.exports=Object.freeze({dayKey,mondayKey,seasonWindow,quotaProposal,candidatePeriod,eventDedupe,completionDedupe,claimDedupe,mode:'DESIGN_ONLY_NO_GRANTS'});
