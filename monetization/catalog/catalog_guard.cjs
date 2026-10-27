'use strict';
// DRAFT-ONLY. This file is deliberately NOT a payment adapter or live SKU entitlement source.
// Never use browser-side catalog state as proof of ownership/payment.
const fs = require('node:fs');
const path = require('node:path');

const allowedTypes = new Set(['account_once', 'consumable', 'non_consumable', 'seasonal_non_consumable']);
const allowedCategories = new Set(['starter', 'currency_pack', 'cosmetic', 'season_pass']);
const parentFields = ['schema_version','environment','display_currency','price_source','checkout_enabled',
 'client_grants_enabled','merchant_connected','backend_ledger_connected','note_ko','products'];
const skuFields = ['sku','category','purchase_type','status','price_minor','premium_crystal_units',
 'entitlement_id','repeat_limit','title_ko','content_state'];
function exactKeys(obj, keys) {
 return obj && typeof obj === 'object' && !Array.isArray(obj) &&
 Object.keys(obj).length === keys.length && keys.every(k => Object.prototype.hasOwnProperty.call(obj, k));
}
function validateDraftCatalog(doc) {
 const errors = [];
 if (!exactKeys(doc, parentFields)) return {valid:false, errors:['catalog unexpected or missing keys']};
 if (doc.schema_version !== 'm01.v1') errors.push('schema_version');
 if (doc.environment !== 'DRAFT_ONLY') errors.push('environment');
 if (doc.display_currency !== 'KRW') errors.push('currency');
 if (doc.price_source !== 'VERIFIED_PROVIDER_CATALOG_ONLY') errors.push('price_source');
 for (const k of ['checkout_enabled', 'client_grants_enabled', 'merchant_connected', 'backend_ledger_connected'])
  if (doc[k] !== false) errors.push(k + ':must_remain_false');
 if (typeof doc.note_ko !== 'string' || doc.note_ko.length < 1) errors.push('note_ko');
 if (!Array.isArray(doc.products) || !doc.products.length || doc.products.length > 30)
  return {valid:false, errors:[...errors, 'products']};
 const seen = new Set();
 for (const [i,p] of doc.products.entries()) {
  const key = 'products[' + i + ']';
  if (!exactKeys(p, skuFields)) {errors.push(key + ':shape'); continue;}
  if (!/^[a-z][a-z0-9_]{2,64}$/.test(p.sku)) errors.push(key + ':sku');
  if (seen.has(p.sku)) errors.push(key + ':duplicate_sku');
  seen.add(p.sku);
  if (!allowedTypes.has(p.purchase_type)) errors.push(key + ':purchase_type');
  if (!allowedCategories.has(p.category)) errors.push(key + ':category');
  if (p.status !== 'draft_disabled') errors.push(key + ':status');
  for (const k of ['price_minor', 'premium_crystal_units', 'entitlement_id'])
   if (p[k] !== null) errors.push(key + ':unsafe_' + k);
  if (p.content_state !== 'not_finalized') errors.push(key + ':content_state');
  if (typeof p.title_ko !== 'string' || p.title_ko.length < 1) errors.push(key + ':title');
  if (p.purchase_type === 'consumable' && p.repeat_limit !== null) errors.push(key + ':consumable_limit');
  if (p.purchase_type !== 'consumable' && p.repeat_limit !== 1) errors.push(key + ':one_time_limit');
 }
 return {valid: errors.length===0, errors};
}
function getDraftCatalog() {
 const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'draft_skus.json'), 'utf8'));
 const result = validateDraftCatalog(data);
 if (!result.valid) throw new Error('Unsafe draft catalog: ' + result.errors.join(','));
 return data;
}
function canBeginCheckout(catalog, sku) {
 // M01 does not have server receipts, provider checkout or signed webhooks.
 // A later ACTIVE schema/adapter must be implemented behind a server-side gate in M03/M04.
 const verified = validateDraftCatalog(catalog);
 if (!verified.valid) return {allowed:false, reason:'CATALOG_INVALID', errors:verified.errors};
 if (!catalog.products.some(p => p.sku === sku)) return {allowed:false, reason:'SKU_UNAVAILABLE'};
 return {allowed:false, reason:'PAYMENTS_NOT_CONNECTED'};
}
module.exports = {validateDraftCatalog, getDraftCatalog, canBeginCheckout};
