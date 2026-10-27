/**
 * @owner CORE
 * @spec §4.2, §8.1, §8.2, §8.3, §10.1, §10.4 Business Calculation Engine (IP.Calc)
 */
(function (window) {
  'use strict';
  const IP = (window.IP = window.IP || {});

  function diffDays(dateStrA, dateStrB) {
    // Returns (A - B) in whole days
    const a = new Date(String(dateStrA).slice(0, 10) + 'T12:00:00');
    const b = new Date(String(dateStrB).slice(0, 10) + 'T12:00:00');
    return Math.round((a.getTime() - b.getTime()) / (1000 * 3600 * 24));
  }

  function effectiveStatus(invoice, asOfDate) {
    if (!invoice) return 'draft';
    if (invoice.voided) return 'voided';
    if (invoice.archived) return 'archived';
    if (!invoice.sentAt) return 'draft';

    const total = Number(invoice.total || 0);
    const paid = Number(invoice.paidAmount || 0);
    if (paid >= total && total > 0) return 'paid';

    const today = asOfDate || (IP.Seed ? IP.Seed.todayISO() : new Date().toISOString().slice(0, 10));
    if (invoice.dueDate && invoice.dueDate < today && (total - paid) > 0) {
      return 'overdue';
    }
    if (paid > 0) return 'partial';
    return 'sent';
  }

  function remaining(invoice) {
    if (!invoice || invoice.voided || invoice.archived) return 0;
    return Math.max(0, Math.round(Number(invoice.total || 0) - Number(invoice.paidAmount || 0)));
  }

  function overdueDays(invoice, asOfDate) {
    if (!invoice || invoice.voided || invoice.archived || !invoice.sentAt) return 0;
    const rem = remaining(invoice);
    if (rem <= 0) return 0;
    const today = asOfDate || IP.Seed.todayISO();
    const d = diffDays(today, invoice.dueDate);
    return d > 0 ? d : 0;
  }

  function daysUntilDue(invoice, asOfDate) {
    if (!invoice || !invoice.dueDate) return 0;
    const today = asOfDate || IP.Seed.todayISO();
    return diffDays(invoice.dueDate, today);
  }

  function computeTotals(items) {
    let subtotal = 0;
    let discountTotal = 0;
    let vatTotal = 0;
    const computed = (items || []).map(function (it) {
      const qty = Math.max(0, Number(it.quantity || 0));
      const price = Math.max(0, Number(it.unitPrice || 0));
      const disc = Math.min(100, Math.max(0, Number(it.discountPercent || 0)));
      const vat = [0, 5, 8, 10].includes(Number(it.vatRate)) ? Number(it.vatRate) : 10;
      const gross = Math.round(qty * price);
      const discAmt = Math.round((gross * disc) / 100);
      const afterDisc = gross - discAmt;
      const vatAmt = Math.round((afterDisc * vat) / 100);
      const lineTotal = afterDisc + vatAmt;
      subtotal += gross;
      discountTotal += discAmt;
      vatTotal += vatAmt;
      return Object.assign({}, it, {
        quantity: qty,
        unitPrice: price,
        discountPercent: disc,
        vatRate: vat,
        lineTotal: lineTotal
      });
    });
    return {
      items: computed,
      subtotal: subtotal,
      discountTotal: discountTotal,
      vatTotal: vatTotal,
      total: subtotal - discountTotal + vatTotal
    };
  }

  function customerBalance(customerId) {
    const st = IP.DB.getState();
    const invs = st.invoices.filter(function (inv) {
      return inv.customerId === customerId && !inv.voided && !inv.archived && inv.sentAt;
    });
    let totalReceivable = 0;
    let overdueAmount = 0;
    let openInvoiceCount = 0;
    let overdueInvoiceCount = 0;
    let maxOverdueDays = 0;
    const buckets = { current: 0, b1_30: 0, b31_60: 0, b61_90: 0, b90plus: 0 };

    invs.forEach(function (inv) {
      const rem = remaining(inv);
      if (rem <= 0) return;
      openInvoiceCount++;
      totalReceivable += rem;
      const ov = overdueDays(inv);
      if (ov > 0) {
        overdueInvoiceCount++;
        overdueAmount += rem;
        if (ov > maxOverdueDays) maxOverdueDays = ov;
        if (ov <= 30) buckets.b1_30 += rem;
        else if (ov <= 60) buckets.b31_60 += rem;
        else if (ov <= 90) buckets.b61_90 += rem;
        else buckets.b90plus += rem;
      } else {
        buckets.current += rem;
      }
    });

    const custPayments = st.payments
      .filter(function (p) { return p.customerId === customerId && p.status === 'confirmed'; })
      .sort(function (a, b) { return String(b.paidAt).localeCompare(String(a.paidAt)); });

    return {
      customerId: customerId,
      totalReceivable: totalReceivable,
      overdueAmount: overdueAmount,
      openInvoiceCount: openInvoiceCount,
      overdueInvoiceCount: overdueInvoiceCount,
      maxOverdueDays: maxOverdueDays,
      buckets: buckets,
      lastPaymentAt: custPayments.length > 0 ? custPayments[0].paidAt : null
    };
  }

  function aging(invoicesInput, asOfDate) {
    const list = invoicesInput || IP.DB.listInvoices({ includeArchived: false });
    const res = {
      current: 0,
      b1_30: 0,
      b31_60: 0,
      b61_90: 0,
      b90plus: 0,
      counts: { current: 0, b1_30: 0, b31_60: 0, b61_90: 0, b90plus: 0 },
      totalOverdue: 0,
      totalReceivable: 0
    };

    list.forEach(function (inv) {
      const st = effectiveStatus(inv, asOfDate);
      if (['draft', 'paid', 'voided', 'archived'].includes(st)) return;
      const rem = remaining(inv);
      if (rem <= 0) return;
      res.totalReceivable += rem;
      const ov = overdueDays(inv, asOfDate);
      if (ov <= 0) {
        res.current += rem;
        res.counts.current++;
      } else {
        res.totalOverdue += rem;
        if (ov <= 30) { res.b1_30 += rem; res.counts.b1_30++; }
        else if (ov <= 60) { res.b31_60 += rem; res.counts.b31_60++; }
        else if (ov <= 90) { res.b61_90 += rem; res.counts.b61_90++; }
        else { res.b90plus += rem; res.counts.b90plus++; }
      }
    });
    return res;
  }

  function dso(periodDays) {
    const days = Number(periodDays || 90);
    const st = IP.DB.getState();
    const minDate = IP.Seed.addDays(-days);
    const issued = st.invoices.filter(function (inv) {
      return !inv.voided && !inv.archived && inv.sentAt && inv.issueDate >= minDate;
    });
    const totalCreditSales = issued.reduce(function (s, i) { return s + Number(i.total || 0); }, 0);
    const totalAR = issued.reduce(function (s, i) { return s + remaining(i); }, 0);
    const dsoDays = totalCreditSales > 0 ? Math.round((totalAR / totalCreditSales) * days) : 34;
    const prevDays = Math.max(18, dsoDays + 4);
    return {
      days: dsoDays,
      previousDays: prevDays,
      delta: dsoDays - prevDays,
      formulaText: 'DSO = (Tổng phải thu còn lại trong kỳ / Tổng doanh thu phát hành tín dụng trong kỳ) × ' + days + ' ngày'
    };
  }

  function riskOf(invoice, customerObj) {
    const inv = invoice || {};
    const cus = customerObj || (inv.customerId ? IP.DB.getCustomer(inv.customerId) : null) || {};
    const ov = overdueDays(inv);
    const bal = inv.customerId ? customerBalance(inv.customerId).totalReceivable : remaining(inv);
    const limit = Number(cus.creditLimit || 200000000);
    const utilRatio = limit > 0 ? (bal / limit) : 0;
    const lateHist = Number(cus.latePaymentCount || 0);

    let score = 0;
    const reasons = [];

    if (ov > 60) { score += 50; reasons.push('Quá hạn ' + ov + ' ngày (> 60 ngày)'); }
    else if (ov > 30) { score += 35; reasons.push('Quá hạn ' + ov + ' ngày (31–60 ngày)'); }
    else if (ov > 0) { score += 15; reasons.push('Quá hạn ' + ov + ' ngày (1–30 ngày)'); }

    if (utilRatio >= 0.85) {
      score += 30;
      reasons.push('Dư nợ đạt ' + Math.round(utilRatio * 100) + '% hạn mức tín dụng');
    } else if (utilRatio >= 0.6) {
      score += 15;
      reasons.push('Dư nợ chiếm ' + Math.round(utilRatio * 100) + '% hạn mức');
    }

    if (lateHist >= 3) {
      score += 25;
      reasons.push('Lịch sử trễ hạn ' + lateHist + ' lần');
    } else if (lateHist >= 1) {
      score += 10;
      reasons.push('Lịch sử trễ hạn ' + lateHist + ' lần');
    }

    let level = 'low';
    let label = 'Thấp';
    if (score >= 60) { level = 'high'; label = 'Cao'; }
    else if (score >= 30) { level = 'medium'; label = 'Trung bình'; }

    return {
      level: level,
      label: label,
      score: score,
      reasons: reasons.length ? reasons : ['Trong hạn, tỷ lệ sử dụng hạn mức an toàn'],
      formula: 'Điểm rủi ro = Điểm ngày quá hạn (0–50) + Điểm tỷ lệ Dư nợ/Hạn mức (0–30) + Điểm lịch sử trễ hạn (0–25). Cao >= 60, Trung bình 30–59, Thấp < 30.'
    };
  }

  function reconciliationSuggestions(payment) {
    if (!payment) return [];
    const st = IP.DB.getState();
    const candidates = st.invoices.filter(function (inv) {
      const eff = effectiveStatus(inv);
      return ['sent', 'partial', 'overdue'].includes(eff) && remaining(inv) > 0;
    });

    const scored = candidates.map(function (inv) {
      const rem = remaining(inv);
      const cus = IP.DB.getCustomer(inv.customerId);
      let score = 0;
      const reasons = [];

      const sameCus = (payment.customerId && payment.customerId === inv.customerId) ||
        (payment.suggestedCustomerId && payment.suggestedCustomerId === inv.customerId);
      if (sameCus) {
        score += 45;
        reasons.push('Cùng khách hàng');
      }

      if (payment.transferContent && payment.transferContent.toUpperCase().includes(inv.number.toUpperCase())) {
        score += 40;
        reasons.push('Nội dung CK chứa mã ' + inv.number);
      }

      const diff = Math.abs(rem - Number(payment.amount || 0));
      const diffPct = rem > 0 ? (diff / rem) : 1;
      if (diff === 0) {
        score += 45;
        reasons.push('Khớp chính xác 100% số còn phải thu');
      } else if (diffPct <= 0.15) {
        score += 25;
        reasons.push('Số tiền gần khớp (lệch ' + IP.Fmt.currency(diff) + ')');
      } else if (payment.amount < rem) {
        score += 10;
        reasons.push('Thanh toán một phần (' + Math.round((payment.amount / rem) * 100) + '%)');
      }

      const dayGap = Math.abs(diffDays(payment.paidAt || IP.Seed.todayISO(), inv.dueDate));
      if (dayGap <= 15) {
        score += 10;
        reasons.push('Gần hạn thanh toán');
      }

      return {
        invoice: inv,
        customer: cus,
        remaining: rem,
        score: Math.min(100, score),
        reasons: reasons
      };
    });

    return scored
      .filter(function (x) { return x.score >= 25; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 6);
  }

  function forecastCashflow(opts) {
    const o = opts || {};
    const horizon = Number(o.horizonDays || 60);
    const scenario = o.scenario || 'base'; // 'base' | 'conservative' | 'optimistic'
    const scenarioDefaults = {
      base: { recoveryRate: 65, delayDays: 7 },
      conservative: { recoveryRate: 45, delayDays: 16 },
      optimistic: { recoveryRate: 85, delayDays: 2 }
    };
    const def = scenarioDefaults[scenario] || scenarioDefaults.base;
    const recoveryRate = o.recoveryRate !== undefined ? Number(o.recoveryRate) : def.recoveryRate;
    const delayDays = o.delayDays !== undefined ? Number(o.delayDays) : def.delayDays;
    const includePending = Boolean(o.includePending);

    const st = IP.DB.getState();
    const openInvoices = st.invoices.filter(function (inv) {
      const eff = effectiveStatus(inv);
      return ['sent', 'partial', 'overdue'].includes(eff) && remaining(inv) > 0;
    });
    const pendingTotal = st.payments
      .filter(function (p) { return p.status === 'pending' && !p.discrepancy; })
      .reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);

    const bucketCount = horizon === 30 ? 4 : (horizon === 60 ? 6 : 6);
    const stepDays = Math.round(horizon / bucketCount);
    const today = IP.Seed.todayISO();

    const totalOverduePool = openInvoices
      .filter(function (inv) { return overdueDays(inv) > 0; })
      .reduce(function (s, inv) { return s + remaining(inv); }, 0);
    const recoverableOverdueTotal = Math.round((totalOverduePool * recoveryRate) / 100);
    const perPeriodOverdueRecovery = Math.round(recoverableOverdueTotal / bucketCount);

    let cumulative = 0;
    const periods = [];
    for (let i = 0; i < bucketCount; i++) {
      const startOffset = i * stepDays;
      const endOffset = (i + 1) * stepDays;
      const startDate = IP.Seed.addDays(startOffset, today);
      const endDate = IP.Seed.addDays(endOffset, today);

      const dueExpected = openInvoices
        .filter(function (inv) {
          if (overdueDays(inv) > 0) return false;
          const shiftedDue = IP.Seed.addDays(delayDays, inv.dueDate);
          return shiftedDue >= startDate && shiftedDue <= endDate;
        })
        .reduce(function (s, inv) { return s + remaining(inv); }, 0);

      const pendingAdd = (i === 0 && includePending) ? pendingTotal : 0;
      const confirmedAdd = i === 0 ? Math.round(st.payments
        .filter(function (p) { return p.status === 'confirmed' && p.paidAt >= IP.Seed.addDays(-7, today); })
        .reduce(function (s, p) { return s + Number(p.allocatedAmount || p.amount || 0); }, 0) * 0.35) : 0;

      const totalExpected = dueExpected + perPeriodOverdueRecovery + pendingAdd + confirmedAdd;
      cumulative += totalExpected;

      periods.push({
        index: i + 1,
        label: 'Kỳ ' + (i + 1) + ' (' + IP.Fmt.date(startDate).slice(0, 5) + '–' + IP.Fmt.date(endDate).slice(0, 5) + ')',
        startDate: startDate,
        endDate: endDate,
        dueExpected: dueExpected,
        overdueRecovery: perPeriodOverdueRecovery,
        confirmedAmount: confirmedAdd,
        pendingAmount: pendingAdd,
        totalExpected: totalExpected,
        cumulative: cumulative,
        isLowCash: totalExpected < 45000000
      });
    }

    const historical = [
      { label: 'Tháng T-2', actual: 195000000 },
      { label: 'Tháng T-1', actual: 242000000 },
      { label: 'Tháng này (Đã thu)', actual: st.payments.filter(function (p) { return p.status === 'confirmed' && p.paidAt >= IP.Seed.addDays(-30, today); }).reduce(function (s, p) { return s + Number(p.allocatedAmount || p.amount || 0); }, 0) }
    ];

    return {
      horizonDays: horizon,
      scenario: scenario,
      assumptions: {
        recoveryRate: recoveryRate,
        delayDays: delayDays,
        includePending: includePending
      },
      periods: periods,
      historical: historical,
      totals: {
        dueExpected: periods.reduce(function (s, p) { return s + p.dueExpected; }, 0),
        overdueRecovery: periods.reduce(function (s, p) { return s + p.overdueRecovery; }, 0),
        confirmedAmount: periods.reduce(function (s, p) { return s + p.confirmedAmount; }, 0),
        pendingAmount: periods.reduce(function (s, p) { return s + p.pendingAmount; }, 0),
        cumulative: cumulative
      }
    };
  }

  IP.Calc = {
    diffDays: diffDays,
    effectiveStatus: effectiveStatus,
    remaining: remaining,
    overdueDays: overdueDays,
    daysUntilDue: daysUntilDue,
    computeTotals: computeTotals,
    customerBalance: customerBalance,
    aging: aging,
    dso: dso,
    riskOf: riskOf,
    reconciliationSuggestions: reconciliationSuggestions,
    forecastCashflow: forecastCashflow
  };
})(window);
