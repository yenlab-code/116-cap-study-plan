/* 已排任務：只搬動有明確未完成回報的任務，不推定未填紀錄的狀態。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.capScheduler = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const DAY = 86400000;
  const dateValue = s => Date.parse(s + 'T00:00:00Z');
  const dateAdd = (s, n) => new Date(dateValue(s) + n * DAY).toISOString().slice(0, 10);
  const completed = r => !!(r && r.read && r.practice && r.correct);
  function capacity(date, days, plan = {}) {
    if (plan.blockedDates?.includes(date)) return 0;
    const dow = new Date(dateValue(date)).getUTCDay();
    const defaultMinutes = (dow === 0 && date >= '2027-02-28') ? 0 : date >= (plan.reportStartDate || '9999-12-31') && plan.capacityByWeekday ? plan.capacityByWeekday[dow] : dow === 1 || dow === 3 ? 0 : dow === 0 || dow === 6 ? 90 : 75;
    const override = days[date]?.availableMinutes;
    return Number.isInteger(override) && override >= 0 && override <= 180 ? override : (plan.capacityByDate?.[date] ?? defaultMinutes);
  }
  function build(plan, state, today) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || !Number.isFinite(dateValue(today))) throw Error('日期格式錯誤');
    const records = state.records || {}, days = state.days || {};
    const assigned = {}, moved = [], needsHelp = [], unreported = [], overflow = [];
    const occupied = {};
    for (const t of plan.tasks) {
      assigned[t.id] = t.date;
      if (completed(records[t.id])) continue;
      if (t.date >= today) {
        occupied[t.date] = (occupied[t.date] || 0) + t.minutes;
      } else if (!records[t.id]?.reason || !['homework','event','too_much','prerequisite','method'].includes(records[t.id].reason)) {
        unreported.push(t.id);
      } else if (['prerequisite','method'].includes(records[t.id].reason)) {
        needsHelp.push(t.id);
      }
    }
    const pending = plan.tasks.filter(t => t.date < today && !completed(records[t.id]) && ['homework','event','too_much'].includes(records[t.id]?.reason))
      .sort((a, b) => ((b.kind === '當前課程' || b.kind === '段考鞏固') ? 1 : 0) - ((a.kind === '當前課程' || a.kind === '段考鞏固') ? 1 : 0) || a.date.localeCompare(b.date));
    for (const t of pending) {
      let target;
      for (let i = 0; i < 14; i++) {
        const candidate = dateAdd(today, i);
        if (plan.blockedDates?.includes(candidate)) continue;
        if (plan.endDate && candidate > plan.endDate) break;
        if ((t.kind === '當前課程' || t.kind === '段考鞏固') && candidate >= '2026-10-14' && t.date < '2026-10-14') break;
        if ((occupied[candidate] || 0) + t.minutes <= capacity(candidate, days, plan)) {
          target = candidate;
          break;
        }
      }
      if (!target) { overflow.push(t.id); continue; }
      assigned[t.id] = target;
      occupied[target] = (occupied[target] || 0) + t.minutes;
      moved.push({id: t.id, from: t.date, to: target, reason: records[t.id].reason});
    }
    return {assigned, moved, needsHelp, unreported, overflow, occupied};
  }
  return {build, capacity, completed};
});
