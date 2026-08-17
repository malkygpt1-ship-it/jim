(() => {
  const AUTH_KEY = 'gf-authenticated';
  const isLogin = location.pathname.endsWith('/login.html') || location.pathname.endsWith('login.html');

  const loadVanTheme = () => {
    if (document.querySelector('link[href^="van-theme.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'van-theme.css?v=2';
    document.head.appendChild(link);
  };

  const loadStickyHeader = () => {
    if (document.getElementById('gf-sticky-header')) return;
    const style = document.createElement('style');
    style.id = 'gf-sticky-header';
    style.textContent = `
      .topbar{
        position:-webkit-sticky!important;
        position:sticky!important;
        top:0!important;
        z-index:10000!important;
        isolation:isolate;
      }
      body.pdf-export .topbar{position:static!important}
      @media print{.topbar{position:static!important}}
    `;
    document.head.appendChild(style);
  };

  loadStickyHeader();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadVanTheme, { once: true });
  } else {
    loadVanTheme();
  }

  if (!isLogin && sessionStorage.getItem(AUTH_KEY) !== 'yes') {
    location.replace('login.html');
    return;
  }
  window.GF_AUTH = {
    async logout() {
      try{await fetch('/api/logout',{method:'POST',credentials:'same-origin'})}catch{}
      sessionStorage.removeItem(AUTH_KEY);
      location.replace('login.html');
    }
  };
})();
