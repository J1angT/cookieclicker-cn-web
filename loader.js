(() => {
  // 改成你自己的 GitHub Pages 地址，末尾保留 /
  const BASE = 'https://J1angT.github.io/cookieclicker-cn-web/';

  const MOD_ID = 'TWCNClickerCN';
  const FLAG = '__COOKIE_CLICKER_CN_WEB_LOADER__';

  if (window[FLAG]) return;
  window[FLAG] = true;

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = () => reject(
        new Error('无法加载脚本：' + url)
      );
      document.head.appendChild(script);
    });
  }

  async function start() {
    if (Game.mods && Game.mods[MOD_ID]) {
      console.log('[中文补全] 模组已经注册。');
      return;
    }

    if (typeof window.ModLanguage !== 'function') {
      throw new Error('当前游戏缺少 ModLanguage 接口。');
    }

    if (localStorage.getItem('CookieClickerLang') !== 'ZH-CN') {
      throw new Error('请先将游戏语言设置为简体中文，再刷新页面。');
    }

    // 获取原版主脚本。
    const response = await fetch(BASE + 'main.js');
    if (!response.ok) {
      throw new Error('main.js 下载失败：HTTP ' + response.status);
    }

    let source = await response.text();

    // 将 Steam 本地资源路径改为网页资源路径。
    const pathPattern =
      /this\.dirURI\s*=\s*this\.dir\s*\?[^;]+:\s*'CookieClickerCNMod';/;

    if (!pathPattern.test(source)) {
      throw new Error(
        'main.js 的结构与已检查的版本不同，请勿继续套用此适配。'
      );
    }

    source = source.replace(
      pathPattern,
      () => 'this.dirURI = ' + JSON.stringify(BASE.replace(/\/+$/, '')) + ';'
    );

    // 先加载语言包，再执行修改路径后的主脚本。
    await loadScript(BASE + 'lang.js');

    const blob = new Blob([source], {
      type: 'text/javascript'
    });
    const url = URL.createObjectURL(blob);

    try {
      await loadScript(url);
    } finally {
      URL.revokeObjectURL(url);
    }

    console.log(
      '[中文补全] 已执行加载。请检查游戏设置和控制台是否有报错。'
    );
  }

  let attempts = 0;

  function waitForGame() {
    const game = window.Game;

    if (
      game &&
      game.ready &&
      typeof game.registerMod === 'function'
    ) {
      start().catch(error => {
        console.error('[中文补全]', error);
        alert('中文补全加载失败：\n' + error.message);
      });
      return;
    }

    if (++attempts < 120) {
      setTimeout(waitForGame, 500);
    } else {
      console.error('[中文补全] 等待游戏加载超时，请刷新重试。');
    }
  }

  waitForGame();
})();
