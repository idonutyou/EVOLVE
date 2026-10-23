const assert=require('node:assert/strict');
module.exports=async page=>{
 await page.waitForFunction(()=>window.__EVOLVE_ADMIN_MODE_V585__,null,{timeout:180000});
 if(!await page.evaluate(()=>window.__EVOLVE_ADMIN_MODE_V585__.read().enabled)){
  for(let i=0;i<5;i++)await page.locator('#codexBtn').click();
 }
 assert.equal(await page.evaluate(()=>window.__EVOLVE_ADMIN_MODE_V585__.read().enabled),true);
 await page.locator('#homeBattleTabV522').click();
 await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.go(30,'auto',false));
};
