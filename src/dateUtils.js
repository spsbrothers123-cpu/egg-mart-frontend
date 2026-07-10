// ─── Timezone-safe date helpers ──────────────────────────────────────────────
// This is an India-based POS, but Dashboard/Reports previously compared
// `new Date(bill.created_at).toDateString()` against "today" using whatever
// timezone the *browser/OS* happens to be set to. If that clock isn't IST
// (a misconfigured terminal, or a laptop left on UTC), a bill placed near
// midnight IST can land on the wrong day in every report. Formatting
// explicitly in Asia/Kolkata makes the day boundary consistent regardless of
// the local machine's timezone setting.

/** Returns a YYYY-MM-DD string for `date` as observed in IST. */
export function istDateKey(date) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

/** True if `date` falls on the same IST calendar day as right now. */
export function isTodayIST(date) {
  return istDateKey(date) === istDateKey(new Date())
}
