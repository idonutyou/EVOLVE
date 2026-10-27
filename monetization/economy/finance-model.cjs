'use strict';

const {hypotheticalCash} = require('./scenario-model.cjs');

// Gross, refunds, fee and output-VAT reserve are estimates under specified inputs.
// They are not a tax filing, settlement, operating profit or real transactions.
function simulateBatch({orders, processingFeeRate=0.034, processingFeeVatRate=0.1,
  salesVatRate=0.1, feesOnRefundedOrders=true}) {
  if (!Array.isArray(orders) || !orders.length || orders.length>1000) throw new TypeError('orders must be a nonempty array');
  const totals={orders:0,refundOrders:0,gross:0,refunded:0,fee:0,outputVatReserve:0,remainingBeforeOtherCosts:0};
  const rows=orders.map(o=>{
    const r=hypotheticalCash({...o,processingFeeRate,processingFeeVatRate,salesVatRate,feesOnRefundedOrders});
    totals.orders+=r.count;totals.refundOrders+=r.refunds;totals.gross+=r.gross;
    totals.refunded+=r.refunded;totals.fee+=r.fee;totals.outputVatReserve+=r.outputVatReserve;
    totals.remainingBeforeOtherCosts+=r.remainingBeforeOtherCosts;
    return r;
  });
  return {kind:'SIMULATION_ONLY',notOperatingProfit:true,
    assumptions:{processingFeeRate,processingFeeVatRate,salesVatRate,feesOnRefundedOrders},
    totals,rows};
}

function exampleSensitivity() {
  const skus=['starter_genome_once','mutation_crystal_small','mutation_crystal_mid','appearance_unlock_01'];
  const counts=[40,30,10,20];
  const cases=[
    {label:'0% counts',refunds:[0,0,0,0]},
    {label:'2% counts',refunds:[1,1,0,0]},
    {label:'10% counts',refunds:[4,3,1,2]}
  ];
  const results=[];
  for (const feeRate of [0.03,0.034,0.05]) for (const c of cases) {
    const orders=skus.map((sku,i)=>({sku,count:counts[i],refunds:c.refunds[i]}));
    const model=simulateBatch({orders,processingFeeRate:feeRate,feesOnRefundedOrders:true});
    results.push({feeRate,refundCase:c.label,...model.totals});
  }
  return {kind:'SIMULATION_ONLY',warning:'Entirely illustrative; cancellation fee and tax handling depend on actual provider and tax status.',
    assumptions:{initialOrders:100,feesOnRefundedOrders:true,salesVatRate:.1,processingFeeVatRate:.1},
    results};
}

module.exports={simulateBatch,exampleSensitivity};
