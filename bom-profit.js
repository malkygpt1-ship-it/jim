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

  function updateProfitPanels() {
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

    const toolCost = moneyValue('sumToolCost');
    const toolQuote = moneyValue('sumTools');
    const toolProfit = toolQuote - toolCost;
    const toolProfitPct = toolQuote > 0 ? (toolProfit / toolQuote) * 100 : 0;

    const toolCostGrand = document.getElementById('toolCostGrand');
    const toolQuoteGrand = document.getElementById('toolQuoteGrand');
    const toolProfitEl = document.getElementById('toolProfit');
    const toolProfitPctEl = document.getElementById('toolProfitPct');

    if (toolCostGrand) toolCostGrand.textContent = money(toolCost);
    if (toolQuoteGrand) toolQuoteGrand.textContent = money(toolQuote);
    if (toolProfitEl) toolProfitEl.textContent = money(toolProfit);
    if (toolProfitPctEl) toolProfitPctEl.textContent = `${toolProfitPct.toFixed(1)}%`;
  }

  function watch(id) {
    const el = document.getElementById(id);
    if (!el) return;
    new MutationObserver(updateProfitPanels).observe(el, {
      subtree: true,
      childList: true,
      characterData: true
    });
  }

  ['sumBillMaterials','sumMaterials','sumToolCost','sumTools'].forEach(watch);
  document.addEventListener('input', () => queueMicrotask(updateProfitPanels));
  document.addEventListener('change', () => queueMicrotask(updateProfitPanels));
  document.addEventListener('click', () => queueMicrotask(updateProfitPanels));
  requestAnimationFrame(updateProfitPanels);
})();
