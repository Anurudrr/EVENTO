import Settlement from '../models/Settlement.ts';

export const DEFAULT_COMMISSION_RATE = 0.12;
type SettlementStatus = 'pending' | 'on_hold' | 'ready' | 'paid' | 'reversed';

const roundCurrency = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

const hasLedgerEntry = (entries: any[], kind: string, amount: number, noteFragment: string) => (
  entries.some((entry) => (
    entry.kind === kind
    && roundCurrency(Number(entry.amount || 0)) === roundCurrency(amount)
    && typeof entry.note === 'string'
    && entry.note.includes(noteFragment)
  ))
);

const hasActiveRefundWorkflow = (refundStatus: unknown) => (
  typeof refundStatus === 'string' && ['requested', 'approved', 'processed'].includes(refundStatus)
);

const deriveSettlementStatus = (booking: any): SettlementStatus => {
  if (booking?.refundStatus === 'processed') {
    return 'reversed';
  }

  if (['requested', 'approved'].includes(booking?.refundStatus || '')) {
    return 'on_hold';
  }

  if (booking?.paymentStatus === 'verified') {
    return 'ready';
  }

  return 'pending';
};

const buildSettlementAmounts = (booking: any) => {
  const grossAmount = roundCurrency(Number(booking?.amount || 0));
  const commissionRate = roundCurrency(Number(booking?.commissionRate ?? DEFAULT_COMMISSION_RATE));
  const commissionAmount = roundCurrency(grossAmount * commissionRate);
  const netAmount = roundCurrency(Math.max(0, grossAmount - commissionAmount));

  return {
    grossAmount,
    commissionRate,
    commissionAmount,
    netAmount,
  };
};

export const syncSettlementForBooking = async (booking: any, options?: { paymentId?: string | null; note?: string }) => {
  if (!booking?._id || !booking?.service || !booking?.organizer) {
    return null;
  }

  const { grossAmount, commissionAmount, commissionRate, netAmount } = buildSettlementAmounts(booking);
  const existing = await Settlement.findOne({ booking: booking._id });
  const status: SettlementStatus = existing?.status === 'paid' && !hasActiveRefundWorkflow(booking?.refundStatus)
    ? 'paid'
    : deriveSettlementStatus(booking);
  const paidAt = booking.paidAt ? new Date(booking.paidAt) : null;
  const dueAt = paidAt ? new Date(paidAt.getTime() + (7 * 24 * 60 * 60 * 1000)) : undefined;
  const entries = Array.isArray(existing?.entries) ? [...existing.entries] : [];

  if (status !== 'pending' && !hasLedgerEntry(entries, 'hold', grossAmount, 'Gross booking value')) {
    entries.push({
      kind: 'hold',
      amount: grossAmount,
      note: 'Gross booking value captured for settlement.',
      createdAt: paidAt || new Date(),
    });
  }

  if (status !== 'pending' && !hasLedgerEntry(entries, 'commission', commissionAmount, 'Platform commission')) {
    entries.push({
      kind: 'commission',
      amount: commissionAmount,
      note: `Platform commission reserved at ${(commissionRate * 100).toFixed(0)}%.`,
      createdAt: paidAt || new Date(),
    });
  }

  if (status === 'reversed' && !hasLedgerEntry(entries, 'refund', grossAmount, 'Refund processed')) {
    entries.push({
      kind: 'refund',
      amount: grossAmount,
      note: options?.note || 'Refund processed and settlement reversed.',
      createdAt: new Date(),
    });
  }

  const settlement = await Settlement.findOneAndUpdate(
    { booking: booking._id },
    {
      organizer: booking.organizer,
      booking: booking._id,
      payment: options?.paymentId || existing?.payment || null,
      service: booking.service,
      grossAmount,
      commissionRate,
      commissionAmount,
      netAmount,
      currency: booking.currency || 'INR',
      status,
      dueAt,
      notes: options?.note || existing?.notes || '',
      ...(status === 'paid'
        ? { paidAt: existing?.paidAt || new Date() }
        : existing?.paidAt ? { paidAt: existing.paidAt } : {}),
      entries,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return settlement;
};

export const markSettlementPaid = async (settlementId: string, note = 'Settlement paid to organizer.') => {
  const settlement = await Settlement.findById(settlementId);

  if (!settlement) {
    return null;
  }

  const entries = Array.isArray(settlement.entries) ? [...settlement.entries] : [];

  if (!hasLedgerEntry(entries, 'payout', settlement.netAmount, 'Settlement paid')) {
    entries.push({
      kind: 'payout',
      amount: settlement.netAmount,
      note,
      createdAt: new Date(),
    });
  }

  settlement.status = settlement.status === 'reversed' ? settlement.status : 'paid';
  settlement.paidAt = new Date();
  settlement.notes = note;
  settlement.entries = entries as any;
  await settlement.save();

  return settlement;
};
