(() => {
  const AUTH_KEY = 'gf-authenticated';
  const isLogin = location.pathname.endsWith('/login.html') || location.pathname.endsWith('login.html');
  if (!isLogin && sessionStorage.getItem(AUTH_KEY) !== 'yes') {
    location.replace('login.html');
    return;
  }
  window.GF_AUTH = {
    logout() {
      sessionStorage.removeItem(AUTH_KEY);
      location.replace('login.html');
    }
  };
})();
