const assert=require('node:assert/strict');
// Exercise the real replacement flow, including its accidental-tap input guard.
module.exports=async page=>{
 await page.waitForFunction(()=>window.__EVOLVE_ORGAN_SKILLS_V598__?.read().opening&&window.__EVOLVE_TEST_MODULE_V575__.read().running,null,{timeout:90000});
 assert.equal(await page.locator('#weaponSelectOverlay,[data-weapon]').count(),0);
 assert.equal(await page.locator('#cards .card').count(),3);
 await page.waitForFunction(()=>window.__EVOLVE_ORGAN_SKILLS_V598__.test.canChoose());
 await page.locator('#cards .card[data-organ="arm"]').click();
 await page.waitForFunction(()=>!window.__EVOLVE_UPGRADE_CARDS_V593__.test.context().choosing());
};
