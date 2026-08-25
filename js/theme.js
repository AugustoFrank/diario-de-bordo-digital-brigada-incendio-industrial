// ===== MODO ESCURO =====
// A aplicação imediata do tema (para evitar "flash" de tela clara) acontece
// via script inline no <head> de cada página. Este arquivo cuida apenas
// da interação do botão de alternância.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('db_theme', next);
    });
  });
});
