import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applySale, restoreSale, quantitySoldToday, validateBackup} from '../services/inventory';
import type {StockItem,SaleRecord} from '../types';
const stock: StockItem = {id:'a',name:'测试鞋',purchaseDate:'2026-11-10',initialQuantity:10,currentQuantity:10,unitCost:20,totalCost:200,variants:[{id:'v',size:'40',color:'黑',quantity:10}]};
const sale: SaleRecord = {id:'s',stockId:'a',variantId:'v',size:'40',color:'黑',quantitySold:2,salePricePerUnit:30,totalRevenue:60,profit:20,saleDate:'2026-11-10T12:00:00'};
test('multiple prices for the same variant deduct the sum without mutating input',()=>{
  const result=applySale([stock],[sale,{...sale,id:'s2',quantitySold:3}]);
  assert.equal(result[0].currentQuantity,5); assert.equal(result[0].variants[0].quantity,5); assert.equal(stock.currentQuantity,10);
});
test('overselling, fractions, negative prices and missing variants are rejected',()=>{
  for(const patch of [{quantitySold:11},{quantitySold:1.5},{quantitySold:0},{salePricePerUnit:-1},{variantId:'missing'}]) assert.throws(()=>applySale([stock],[{...sale,...patch}]));
});
test('refund restores deleted variants and reconciles total',()=>{
  const result=restoreSale([{...stock,variants:[],currentQuantity:0}],sale);
  assert.equal(result[0].variants[0].id,'v'); assert.equal(result[0].currentQuantity,2);
});
test('today counts pairs rather than records',()=>{
  assert.equal(quantitySoldToday([sale,{...sale,quantitySold:3},{...sale,saleDate:'2026-11-09T12:00:00'}],new Date('2026-11-10T13:00:00')),5);
});
test('backup round trip supports 1.2 and rejects malformed data before import',()=>{
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify({version:'1.2',stocks:[stock],sales:[sale]}))),{stocks:[stock],sales:[sale]});
  for(const data of [null,{}, {stocks:[stock],sales:{}},{stocks:[{...stock,currentQuantity:-1}],sales:[]},{stocks:[stock,stock],sales:[]},{stocks:[{...stock,category:[]}],sales:[]},{stocks:[stock],sales:[{...sale,quantitySold:1.5}]}]) assert.throws(()=>validateBackup(data));
});
