/* 場景引擎：把 SUDOKU_CHAPTERS 的資料畫成可逐步播放的 SVG 動畫。 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STEP_MS = 3200;
  var ALWAYS = { g: 1, f: 1 };

  function s(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function fontSize(t) { var n = t.length; return n <= 1 ? 62 : n === 2 ? 46 : n === 3 ? 36 : 28; }

  function defaultSteps(n) {
    var all = ['c', 'p', 'a', 'b', 'h', 'x', 'n'];
    if (n <= 1) return [all.concat(['e', 't'])];
    if (n === 2) return [[], all.concat(['e', 't'])];
    var st = [[], all, ['e', 't']];
    while (st.length < n) st.push([]);
    return st.slice(0, n);
  }

  function Scene(host, sc) {
    this.sc = sc;
    this.caps = sc.caps;
    this.n = sc.caps.length;
    this.steps = sc.steps && sc.steps.length === this.n ? sc.steps : defaultSteps(this.n);
    this.cur = -1;
    this.timer = null;
    this.playing = false;
    this.build(host);
  }

  Scene.prototype.build = function (host) {
    var f = this.sc.fig, self = this;
    var W = f.cols * 100, H = f.rows * 100;
    var wrap = h('div', 'board-wrap');
    var px = Math.max(220, Math.min(540, f.cols * Math.max(f.cs || 34, 30) * (f.cols > 5 ? 1.6 : 1.5)));
    wrap.style.maxWidth = Math.round(px) + 'px';
    var svg = s('svg', { viewBox: '-6 -6 ' + (W + 12) + ' ' + (H + 12), role: 'img', 'aria-label': this.sc.title + '的示意圖' }, wrap);
    var gCells = s('g', {}, svg), gGrid = s('g', { 'class': 'grid' }, svg);
    this.cells = [];
    for (var r = 0; r < f.rows; r++) {
      for (var c = 0; c < f.cols; c++) {
        var tok = f.cells[r][c] || '.';
        var kind = tok.charAt(0), txt = tok.slice(1), alt = null;
        if (txt.indexOf('>') >= 0) { var p = txt.split('>'); txt = p[0]; alt = p[1]; }
        var g = s('g', { 'class': 'cell k-' + (kind === '.' ? 'blank' : kind) }, gCells);
        s('rect', { x: c * 100 + 3, y: r * 100 + 3, width: 94, height: 94, 'class': 'bg' }, g);
        var t = s('text', { x: c * 100 + 50, y: r * 100 + 52, 'class': 'tx', 'font-size': fontSize(txt) }, g);
        t.textContent = txt;
        var strike = null;
        if (kind === 'e') strike = s('line', { x1: c * 100 + 14, y1: r * 100 + 86, x2: c * 100 + 86, y2: r * 100 + 14, 'class': 'strike', pathLength: 1 }, g);
        this.cells.push({ g: g, kind: kind, txt: txt, alt: alt, t: t, el: strike, r: r, c: c });
      }
    }
    // 格線
    var i, d = 0;
    function line(x1, y1, x2, y2, cls) { var l = s('line', { x1: x1, y1: y1, x2: x2, y2: y2, 'class': cls, pathLength: 1 }, gGrid); l.style.setProperty('--d', (d++ * 40) + 'ms'); }
    for (i = 0; i <= f.cols; i++) line(i * 100, 0, i * 100, H, (f.tc && i % 3 === 0) || i === 0 || i === f.cols ? 'thick' : 'thin');
    for (i = 0; i <= f.rows; i++) line(0, i * 100, W, i * 100, (f.tr && i % 3 === 0) || i === 0 || i === f.rows ? 'thick' : 'thin');

    // 控制列
    var frame = h('figure', 'frame');
    var cap = h('figcaption', 'cap');
    cap.setAttribute('aria-live', 'polite');
    var ctr = h('div', 'ctrl');
    function btn(label, aria, fn) { var b = h('button', '', label); b.type = 'button'; b.setAttribute('aria-label', aria); b.addEventListener('click', fn); return b; }
    this.bReplay = btn('↺', '重播', function () { self.pause(); self.go(0, true); self.play(); });
    this.bPrev = btn('‹', '上一步', function () { self.pause(); self.go(Math.max(0, self.cur - 1)); });
    this.bPlay = btn('❚❚', '暫停', function () { self.playing ? self.pause() : self.play(); });
    this.bNext = btn('›', '下一步', function () { self.pause(); self.go(Math.min(self.n - 1, self.cur + 1)); });
    this.dots = h('div', 'dots');
    for (i = 0; i < this.n; i++) (function (k) {
      var b = h('button', 'dot'); b.type = 'button'; b.setAttribute('aria-label', '第 ' + (k + 1) + ' 步');
      b.addEventListener('click', function () { self.pause(); self.go(k); }); self.dots.appendChild(b);
    })(i);
    ctr.appendChild(this.bReplay); ctr.appendChild(this.bPrev); ctr.appendChild(this.bPlay); ctr.appendChild(this.bNext); ctr.appendChild(this.dots);
    this.cap = cap;
    frame.appendChild(wrap); frame.appendChild(cap); frame.appendChild(ctr);
    host.appendChild(frame);
    this.frame = frame; this.svg = svg;
    this.go(-1, true);
    if (reduce) { this.go(this.n - 1, true); }
  };

  Scene.prototype.active = function (k) {
    var a = {}; for (var i = 1; i <= k; i++) (this.steps[i] || []).forEach(function (x) { a[x] = 1; });
    if (k >= 0) (this.steps[0] || []).forEach(function (x) { a[x] = 1; });
    return a;
  };

  Scene.prototype.go = function (k, instant) {
    var prev = this.cur;
    if (k < 0) { k = 0; this.cur = -1; } else this.cur = k;
    var act = this.active(k), last = k === this.n - 1;
    var seqH = 0, seqN = 0;
    this.cells.forEach(function (cl) {
      var kd = cl.kind, on = !!ALWAYS[kd] || kd === '.' || (kd === 'x' && cl.txt) || !!act[kd];
      var was = cl.g.classList.contains('on');
      cl.g.classList.toggle('on', on);
      cl.g.classList.toggle('neutral', !on);
      var text = (last && cl.alt !== null) ? cl.alt : cl.txt;
      if (cl.t.textContent !== text) cl.t.textContent = text;
      if (on && !was && !instant && (kd !== 'g' && kd !== 'f' && kd !== '.' && kd !== 'x')) {
        cl.g.style.setProperty('--d', ((kd === 'h' ? seqH++ : kd === 'n' ? seqN++ : 0) * 90) + 'ms');
        cl.g.classList.remove('pulse'); void cl.g.getBoundingClientRect(); cl.g.classList.add('pulse');
      }
      if (!on) cl.g.classList.remove('pulse');
    });
    this.cap.textContent = this.caps[k];
    this.cap.classList.remove('fade'); void this.cap.offsetWidth; this.cap.classList.add('fade');
    var dots = this.dots.children;
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('cur', i === k);
    this.bPrev.disabled = k === 0; this.bNext.disabled = last;
  };

  Scene.prototype.play = function () {
    var self = this;
    if (reduce) return;
    this.playing = true; this.bPlay.textContent = '❚❚'; this.bPlay.setAttribute('aria-label', '暫停');
    clearInterval(this.timer);
    if (this.cur >= this.n - 1) this.go(0);
    this.timer = setInterval(function () {
      if (self.cur >= self.n - 1) { self.pause(); self.done = true; return; }
      self.go(self.cur + 1);
    }, STEP_MS);
  };
  Scene.prototype.pause = function () {
    this.playing = false; clearInterval(this.timer);
    this.bPlay.textContent = '▶'; this.bPlay.setAttribute('aria-label', '播放');
  };

  /* ---------- 頁面組裝 ---------- */
  function buildPage() {
    var C = window.SUDOKU_CHAPTERS || [], I = window.SUDOKU_INTRO || {};
    var root = document.getElementById('chapters'), toc = document.getElementById('toc'), chips = document.getElementById('chips');
    var scenes = [], count = 0;
    var intro = document.getElementById('intro'); if (intro) intro.textContent = I.intro || '';
    var outro = document.getElementById('outro'); if (outro) outro.textContent = I.outro || '';

    C.forEach(function (ch, ci) {
      var sec = h('section', 'chapter'); sec.id = 'ch-' + ch.id;
      var head = h('header', 'ch-head');
      head.appendChild(h('span', 'ch-no', ch.no ? String(ch.no).padStart(2, '0') : '·'));
      var ttl = h('h2', '', ch.name); head.appendChild(ttl);
      head.appendChild(h('p', 'ch-desc', ch.desc || ''));
      sec.appendChild(head);

      var li = h('li'), a = h('a', '', ch.name); a.href = '#ch-' + ch.id; li.appendChild(a); toc.appendChild(li);
      var chip = h('a', 'chip', ch.name); chip.href = '#ch-' + ch.id; chips.appendChild(chip);

      ch.scenes.forEach(function (sc) {
        var art = h('article', 'scene'); art.id = sc.id;
        var tw = h('div', 'scene-title');
        if (ch.no) { count++; tw.appendChild(h('span', 'sn', String(count))); }
        var h3 = h('h3', '', sc.title); tw.appendChild(h3);
        if (sc.lv) { var lv = h('span', 'lv lv-' + ({ '入門': 1, '初級': 2, '中級': 3, '進階': 4, '高階': 5, '專家': 5 }[sc.lv] || 3), sc.lv); tw.appendChild(lv); }
        art.appendChild(tw);
        var body = h('div', 'scene-body');
        var fig = h('div', 'fig'); body.appendChild(fig);
        body.appendChild(h('p', 'prose', sc.text));
        art.appendChild(body); sec.appendChild(art);
        scenes.push({ sc: sc, host: fig, el: art, obj: null });
      });
      root.appendChild(sec);
    });
    var cnt = document.querySelectorAll('[data-count]'); for (var i = 0; i < cnt.length; i++) cnt[i].textContent = count;

    // 延遲建立、進入畫面時自動播放
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var o = e.target.__scene; if (!o) return;
        if (!o.obj) { o.obj = new Scene(o.host, o.sc); }
        if (e.isIntersecting && e.intersectionRatio >= 0.55) {
          if (!o.started && !reduce) { o.started = true; o.obj.go(0, true); o.obj.play(); }
        } else if (!e.isIntersecting && o.obj.playing) { o.obj.pause(); }
      });
    }, { threshold: [0, 0.55, 1], rootMargin: '200px 0px' }) : null;
    scenes.forEach(function (o) {
      o.el.__scene = o;
      if (io) io.observe(o.el); else o.obj = new Scene(o.host, o.sc);
    });
    // 目錄高亮
    var links = toc.querySelectorAll('a');
    var secs = document.querySelectorAll('.chapter');
    if ('IntersectionObserver' in window) {
      var io2 = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          for (var i = 0; i < links.length; i++) links[i].classList.toggle('cur', links[i].getAttribute('href') === '#' + e.target.id);
          var cs = chips.children; for (i = 0; i < cs.length; i++) { var on = cs[i].getAttribute('href') === '#' + e.target.id; cs[i].classList.toggle('cur', on); if (on && cs[i].scrollIntoView && window.innerWidth < 900) chips.scrollTo({ left: cs[i].offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth' }); }
        });
      }, { rootMargin: '-30% 0px -60% 0px' });
      secs.forEach(function (x) { io2.observe(x); });
    }
    window.__scenes = scenes;
  }

  /* ---------- 首圖：9×9 逐格填入 ---------- */
  function buildHero() {
    var host = document.getElementById('hero-board'); if (!host) return;
    var sol = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
    var giv = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
    var svg = s('svg', { viewBox: '-6 -6 912 912', role: 'img', 'aria-label': '數獨解題動畫' }, host);
    var order = [], cells = [], i;
    for (i = 0; i < 81; i++) {
      var r = Math.floor(i / 9), c = i % 9, given = giv.charAt(i) !== '.';
      var g = s('g', { 'class': 'hcell' + (given ? ' given' : '') }, svg);
      var t = s('text', { x: c * 100 + 50, y: r * 100 + 52, 'class': 'tx', 'font-size': 62 }, g);
      t.textContent = given ? giv.charAt(i) : sol.charAt(i);
      if (!given) { order.push(i); g.classList.add('hid'); }
      cells.push(g);
    }
    for (i = 0; i <= 9; i++) {
      s('line', { x1: i * 100, y1: 0, x2: i * 100, y2: 900, 'class': i % 3 === 0 ? 'thick' : 'thin' }, svg);
      s('line', { x1: 0, y1: i * 100, x2: 900, y2: i * 100, 'class': i % 3 === 0 ? 'thick' : 'thin' }, svg);
    }
    // 由左上往右下，帶一點隨機感，但順序固定
    order.sort(function (a, b) { return ((a * 37) % 81) - ((b * 37) % 81); });
    if (reduce) { cells.forEach(function (g) { g.classList.remove('hid'); }); return; }
    var k = 0, T;
    function tick() {
      if (k < order.length) { var g = cells[order[k++]]; g.classList.remove('hid'); g.classList.add('pop'); T = setTimeout(tick, 90); }
      else { T = setTimeout(function () { cells.forEach(function (g) { if (!g.classList.contains('given')) g.classList.add('hid'); g.classList.remove('pop'); }); k = 0; T = setTimeout(tick, 900); }, 3200); }
    }
    T = setTimeout(tick, 900);
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearTimeout(T); else { clearTimeout(T); T = setTimeout(tick, 400); } });
  }

  function init() { buildHero(); buildPage(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
