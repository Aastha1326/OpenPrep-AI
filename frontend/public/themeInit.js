(function () {
  const cachedTheme = localStorage.getItem('openprep_theme');
  if (cachedTheme) {
    document.documentElement.setAttribute('data-theme', cachedTheme);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = prefersDark ? 'dark-slate' : 'light-aurora';
    document.documentElement.setAttribute('data-theme', defaultTheme);
  }
})();
