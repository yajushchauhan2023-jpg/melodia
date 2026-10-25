// Commission in basis points (1500 = 15%). Configurable via env now; move to an admin-editable table later.
export function commissionBps(): number {
  const v = Number(process.env.COMMISSION_BPS ?? 1500);
  return Number.isInteger(v) && v >= 0 && v <= 10000 ? v : 1500;
}

export function splitPrice(priceKsh: number, bps = commissionBps()) {
  if (!Number.isInteger(priceKsh) || priceKsh <= 0) throw new Error("Invalid price");
  const commissionKsh = Math.round((priceKsh * bps) / 10000);
  return { priceKsh, commissionKsh, teacherShareKsh: priceKsh - commissionKsh };
}
