// /lib/data.js
let raw;
try { raw = require('../data/shoesData.js'); } catch {}
try { if (!raw) raw = require('../data/shoes.js'); } catch {}
try { if (!raw) raw = require('../data/shoesdata.json'); } catch {}

const src = Array.isArray(raw?.default) ? raw.default : raw;
if (!Array.isArray(src)) {
  throw new Error('shoes data not found. Put data/shoesData.js (or shoes.js / shoesdata.json)');
}

const toNum = v => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

function normalize(s){
  const chart = Array.isArray(s.chartData) ? s.chartData.map(Number) : [];
  const score = {
    cushion: chart[0] ?? null,
    stability: chart[1] ?? null,
    lightness: chart[2] ?? null,
    cost: chart[3] ?? null,
    fit: chart[4] ?? null,
    design: chart[5] ?? null,
    breathability: chart[6] ?? null,
    speed: chart[7] ?? null,
    grip: chart[8] ?? null,
    durability: chart[9] ?? null,
  };
  const nums = Object.values(score).filter(v => typeof v === 'number');
  const avg  = nums.length ? (nums.reduce((a,b)=>a+b,0)/nums.length) : undefined;
  const overall = toNum(s.rating) ?? (avg !== undefined ? Math.round(avg*10)/10 : undefined);

  return {
    id: String(s.id),
    slug: String(s.id),
    name: s.name || '',
    brand: s.brand || '',
    image: s.image || '/img/placeholder-shoe.jpg',
    weight: toNum(s.weight),
    drop: toNum(s.drop),
    offset: s.offset || null,
    midsole: s.midsole || null,
    purpose: s.purpose || null,
    price: toNum(s.price),
    rating: toNum(s.rating),
    chartData: chart,
    score: { ...score, overall },
  };
}

const shoes = src.map(normalize);
const byId = Object.fromEntries(shoes.map(s => [s.id, s]));

module.exports = { shoes, byId };
