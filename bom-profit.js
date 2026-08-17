(() => {
  const moneyValue = (id) => {
    const el = document.getElementById(id);
    if (!el) return 0;
    const n = Number(String(el.textContent || '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const money = (n) => new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(Number.isFinite(n) ? n : 0);

  function updateBomProfit() {
    const bill = moneyValue('sumBillMaterials');
    const quoted = moneyValue('sumMaterials');
    const profit = quoted - bill;
    const profitPct = quoted > 0 ? (profit / quoted) * 100 : 0;

    const billGrand = document.getElementById('bomBillGrand');
    const quoteGrand = document.getElementById('bomQuoteGrand');
    const profitEl = document.getElementById('materialProfit');
    const profitPctEl = document.getElementById('materialProfitPct');

    if (billGrand) billGrand.textContent = money(bill);
    if (quoteGrand) quoteGrand.textContent = money(quoted);
    if (profitEl) profitEl.textContent = money(profit);
    if (profitPctEl) profitPctEl.textContent = `${profitPct.toFixed(1)}%`;
  }

  function watch(id) {
    const el = document.getElementById(id);
    if (!el) return;
    new MutationObserver(updateBomProfit).observe(el, {
      subtree: true,
      childList: true,
      characterData: true
    });
  }

  watch('sumBillMaterials');
  watch('sumMaterials');
  document.addEventListener('input', () => queueMicrotask(updateBomProfit));
  document.addEventListener('change', () => queueMicrotask(updateBomProfit));
  document.addEventListener('click', () => queueMicrotask(updateBomProfit));
  requestAnimationFrame(updateBomProfit);
})();
