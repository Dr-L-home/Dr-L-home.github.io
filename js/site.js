/* 讀取 js/config.js，把文字與連結填進頁面。 */
(function () {
  var S = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  // 網站根目錄：頁面在子資料夾時，連結要往上一層
  var depth = parseInt(document.body.getAttribute('data-depth') || '0', 10);
  var up = depth ? new Array(depth + 1).join('../') : '';
  var isUrl = function (u) { return /^https?:\/\//i.test(u || ''); };

  // 頁首
  var brand = $('[data-brand]');
  if (brand) { brand.textContent = S.title || '數獨'; brand.setAttribute('href', up || './'); }
  var nav = $('[data-nav]');
  if (nav) {
    var items = [];
    if (S.links && isUrl(S.links.webApp)) items.push(['網頁版', S.links.webApp]);
    if (S.links && isUrl(S.links.playStore)) items.push(['Google Play', S.links.playStore]);
    if (S.handle && S.handle !== 'your-github-username') items.push(['GitHub', 'https://github.com/' + S.handle]);
    items.forEach(function (it) {
      var a = el('a', '', it[0]); a.href = it[1]; a.target = '_blank'; a.rel = 'noopener'; nav.appendChild(a);
    });
  }

  // 首頁
  var tag = $('[data-tagline]');
  if (tag) tag.textContent = S.tagline || '';
  var list = $('[data-topics]');
  if (list && S.topics) {
    S.topics.forEach(function (t) {
      var a = el('a', 'topic ' + (t.status === 'live' ? 'live' : 'reserved'));
      a.href = t.href;
      a.style.setProperty('--accent', t.accent || '#58c4dd');
      a.appendChild(el('span', 'no', t.no));
      a.appendChild(el('h2', '', t.title));
      a.appendChild(el('p', '', t.blurb));
      a.appendChild(el('span', 'status', t.status === 'live' ? '已上線 →' : '預留'));
      list.appendChild(a);
    });
  }
  var linkBox = $('[data-links]');
  if (linkBox) {
    var L = S.links || {};
    var defs = [
      ['webApp', '玩網頁版'],
      ['playStore', '在 Google Play 下載'],
      ['repo', '看原始碼']
    ];
    defs.forEach(function (d) {
      if (isUrl(L[d[0]])) {
        var a = el('a', '', d[1]); a.href = L[d[0]]; a.target = '_blank'; a.rel = 'noopener'; linkBox.appendChild(a);
      } else {
        linkBox.appendChild(el('span', '', d[1] + '（連結待補）'));
      }
    });
  }
  var owner = $('[data-owner]');
  if (owner) owner.textContent = S.owner || '';
  var mail = $('[data-mail]');
  if (mail) {
    if (S.links && S.links.email) { mail.textContent = S.links.email; } else { mail.parentNode.hidden = true; }
  }
  var year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // 預留頁：標題從 config 讀取
  var tid = document.body.getAttribute('data-topic');
  if (tid && S.topics) {
    S.topics.forEach(function (t) {
      if (t.id !== tid) return;
      var h = $('[data-topic-title]'); if (h) h.textContent = t.title;
      var n = $('[data-topic-no]'); if (n) n.textContent = t.no;
      var b = $('[data-topic-blurb]'); if (b) b.textContent = t.blurb;
      document.title = t.title + '｜' + (S.title || '數獨');
      document.body.style.setProperty('--accent', t.accent || '#5cd0b3');
    });
  }
})();
