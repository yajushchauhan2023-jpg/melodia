import assert from "node:assert";
const split = (p, bps = 1500) => { const c = Math.round((p * bps) / 10000); return { c, t: p - c }; };
assert.deepStrictEqual(split(1000), { c: 150, t: 850 });
assert.deepStrictEqual(split(1800), { c: 270, t: 1530 });
assert.strictEqual(split(1233).c + split(1233).t, 1233);
console.log("commission ok");
