import type { StockItem, SaleRecord } from '../types';

export const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Aggregate all rows before deducting a variant, including repeated size/colour rows. */
export function applySale(stocks: StockItem[], records: SaleRecord[]): StockItem[] {
  const requested = new Map<string, Map<string, number>>();
  for (const record of records) {
    if (!Number.isSafeInteger(record.quantitySold) || record.quantitySold <= 0 ||
        !Number.isFinite(record.salePricePerUnit) || record.salePricePerUnit < 0 || !record.variantId) {
      throw new Error('销售数量须为正整数，售价须为非负数。');
    }
    const stock = stocks.find(s => s.id === record.stockId);
    if (!stock?.variants.some(v => v.id === record.variantId)) throw new Error('商品或规格已不存在。');
    const variants = requested.get(record.stockId) ?? new Map<string, number>();
    variants.set(record.variantId, (variants.get(record.variantId) ?? 0) + record.quantitySold);
    requested.set(record.stockId, variants);
  }
  return stocks.map(stock => {
    const quantities = requested.get(stock.id);
    if (!quantities) return stock;
    const variants = stock.variants.map(variant => {
      const quantity = variant.quantity - (quantities.get(variant.id) ?? 0);
      if (quantity < 0) throw new Error('库存不足，请重新打开销售窗口。');
      return {...variant, quantity};
    });
    return {...stock, variants, currentQuantity: variants.reduce((sum,v) => sum + v.quantity, 0)};
  });
}

export function restoreSale(stocks: StockItem[], sale: SaleRecord): StockItem[] {
  return stocks.map(stock => {
    if (stock.id !== sale.stockId) return stock;
    const variants = stock.variants.map(v => ({...v}));
    const variant = variants.find(v => v.id === sale.variantId);
    if (variant) variant.quantity += sale.quantitySold;
    else variants.push({id: sale.variantId || `returned-${sale.id}`, size: sale.size || '未记录', color: sale.color || '未记录', quantity: sale.quantitySold});
    return {...stock, variants, currentQuantity: variants.reduce((sum,v) => sum + v.quantity,0)};
  });
}

export function quantitySoldToday(sales: SaleRecord[], now = new Date()) {
  return sales.filter(s => new Date(s.saleDate).toDateString() === now.toDateString())
    .reduce((sum,s) => sum + s.quantitySold,0);
}

/** Validate a complete backup before replacing any data. Legacy 1.2 exports remain supported. */
export function validateBackup(data: unknown): {stocks: StockItem[]; sales: SaleRecord[]} {
  const fail = (): never => {throw new Error('备份格式无效：商品、规格、数量或销售字段有误。');};
  const obj = data as Record<string, unknown>;
  if (!obj || !Array.isArray(obj.stocks) || !Array.isArray(obj.sales)) return fail();
  const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  const number = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  const integer = (v: unknown) => number(v) && Number.isSafeInteger(v);
  const date = (v: unknown) => text(v) && Number.isFinite(Date.parse(v as string));
  const unique = (items: {id: string}[]) => new Set(items.map(v => v.id)).size === items.length;
  const optionalText = (v: unknown) => v === undefined || typeof v === 'string';
  for (const s of obj.stocks) {
    if (!s || !text(s.id) || !text(s.name) || !date(s.purchaseDate) || !number(s.unitCost) || !number(s.totalCost) ||
        !integer(s.initialQuantity) || !integer(s.currentQuantity) || !Array.isArray(s.variants) || !s.variants.length ||
        ![s.category,s.description,s.imageUrl].every(optionalText)) return fail();
    for (const v of s.variants) if (!v || !text(v.id) || !text(v.size) || !text(v.color) || !integer(v.quantity)) return fail();
    if (!unique(s.variants) || s.variants.reduce((n: number,v: {quantity:number}) => n+v.quantity,0) !== s.currentQuantity) return fail();
  }
  for (const s of obj.sales) {
    if (!s || !text(s.id) || !text(s.stockId) || !date(s.saleDate) || !integer(s.quantitySold) || s.quantitySold === 0 ||
        !number(s.salePricePerUnit) || !number(s.totalRevenue) || typeof s.profit !== 'number' || !Number.isFinite(s.profit) ||
        ![s.variantId,s.size,s.color].every(optionalText) || Math.abs(s.totalRevenue-money(s.quantitySold*s.salePricePerUnit)) > 0.011) return fail();
  }
  if (!unique(obj.stocks) || !unique(obj.sales)) return fail();
  return {stocks: obj.stocks, sales: obj.sales};
}
