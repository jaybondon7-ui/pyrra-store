// Pyrra SMP store front end. Packages, cart and checkout come from the Tebex Headless API.
(() => {
  const C = window.PYRRA_CFG || {};
  const DESC = window.PYRRA_DESC || {};
  const API = 'https://headless.tebex.io/api';
  const DEMO = !C.token;
  const $ = (s) => document.querySelector(s);

  const ICON = {
    cart: '<svg class="ico" viewBox="0 0 24 24"><path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM1 2h3.3l1 2H22l-3.6 8.6a2 2 0 0 1-1.8 1.4H8.1l-.9 1.6V16H19v2H7a2 2 0 0 1-1.7-3l1.3-2.4L3 4H1z"/></svg>',
    back: '<svg class="ico" viewBox="0 0 24 24"><path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z"/></svg>',
    info: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2zm0-8h-2V7h2z"/></svg>',
    user: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5c0-3-4-5.5-9-5.5z"/></svg>',
    trash: '<svg class="ico" viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4zm-3 6h12l-1 12H7z"/></svg>',
  };
  const INFO = {
    ranks: ['RANKS', '<p>Ranks are <strong>lifetime</strong>. Each one gives a tag in front of your name, a free gear kit on a cooldown, and more homes, auction slots and team space. Higher ranks get better kits more often.</p><ul><li>Your rank is added within a minute of paying, even if you are offline.</li><li>Preview any kit in-game with <strong>/previewkit &lt;rank&gt;</strong>.</li><li>If you own more than one rank, you claim the kit of your highest rank.</li></ul>'],
    keys: ['CRATE KEYS', '<p>Each key opens its crate once for <strong>1 of 14 rewards</strong>, and every reward has the <strong>same chance</strong>.</p><ul><li>Keys go into your <strong>/keys</strong> storage, even if you are offline.</li><li>Right-click a crate at Hardcore spawn, or type <strong>/open crate &lt;name&gt;</strong>.</li><li>Left-click a crate to preview every reward first.</li></ul>'],
  };
  const STYLE = {
    ranks: { b1: '#a3170d', b2: '#ff5a1a', b3: '#6e0f08', btn: '#e0321c', edge: '#8f1a0d', qty: false },
    keys: { b1: '#c25a00', b2: '#ffb21e', b3: '#7a3800', btn: '#f2700f', edge: '#9a3f05', qty: true },
    other: { b1: '#8f1a3a', b2: '#ff4a2a', b3: '#5c0f22', btn: '#e0321c', edge: '#8f1a0d', qty: false },
  };

  // ---------- small helpers ----------
  const mem = {};
  const store = {
    get(k) { try { return localStorage.getItem('pyrra_' + k); } catch (e) { return mem[k] ?? null; } },
    set(k, v) { try { v == null ? localStorage.removeItem('pyrra_' + k) : localStorage.setItem('pyrra_' + k, v); } catch (e) { mem[k] = v; } },
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n, cur) => { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || 'USD' }).format(n); } catch (e) { return '$' + Number(n).toFixed(2); } };
  const here = () => location.origin + location.pathname;
  let toastTimer;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3200); }
  function openModal(id) { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }

  async function api(path, opt = {}) {
    const r = await fetch(API + path, {
      method: opt.method || 'GET',
      headers: opt.body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: opt.body ? JSON.stringify(opt.body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.detail || j.title || j.message || ('Tebex error ' + r.status));
    return j.data !== undefined ? j.data : j;
  }

  // ---------- state ----------
  let user = store.get('user');
  let basket = null;
  let cats = [];
  const pkgs = {};

  function extra(p) {
    if (C.packages && C.packages[p.id]) return C.packages[p.id];
    const n = (p.name || '').toLowerCase();
    for (const [k, v] of Object.entries(C.byName || {})) if (n.includes(k)) return v;
    return {};
  }
  function kind(c) {
    const n = (c.name || '').toLowerCase();
    const names = (c.packages || []).map((p) => (p.name || '').toLowerCase());
    if (/key|crate/.test(n) || (names.length && names.every((x) => x.includes('key')))) return 'keys';
    if (/rank/.test(n) || (names.length && names.every((x) => x.includes('rank')))) return 'ranks';
    return 'other';
  }

  // ---------- rendering ----------
  function card(p, k) {
    const x = extra(p), s = STYLE[k];
    const img = p.image || x.img || 'images/pyrra_smp_logo.png';
    const qty = s.qty && !p.disable_quantity;
    return `<article class="py-card" style="--c:${esc(x.color || '#ff9a1f')}" data-id="${esc(p.id)}">
      ${x.badge ? `<span class="py-badge">${esc(x.badge)}</span>` : ''}
      <div class="art" data-tip="Click for more details" data-open="${esc(p.id)}"><img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy"></div>
      <h3>${esc(p.name)}</h3><div class="price">${money(p.total_price, p.currency)}</div>
      ${qty ? `<div class="py-qty">${[1, 5, 10, 20].map((q, i) => `<button type="button" class="${i ? '' : 'on'}" data-q="${q}">${q}x</button>`).join('')}</div>` : ''}
      <button class="py-cart" type="button" data-add="${esc(p.id)}">${ICON.cart} Add to cart</button>
    </article>`;
  }

  function render() {
    const root = $('#cats');
    if (!cats.length) { root.innerHTML = '<p class="py-loading">Nothing for sale right now. Check back soon.</p>'; return; }
    $('#catMenu').innerHTML = cats.map((c) => `<a href="#cat-${esc(c.id)}">${esc(c.name)}</a>`).join('');
    root.innerHTML = cats.map((c) => {
      const k = kind(c), s = STYLE[k];
      return `<div class="py-banner" id="cat-${esc(c.id)}" style="--b1:${s.b1};--b2:${s.b2};--b3:${s.b3}">
        <button type="button" data-top>${ICON.back} Back</button>
        <h2>${esc((c.name || '').toUpperCase())}</h2>
        <button type="button" class="info" data-info="${esc(c.id)}">${ICON.info} <span class="more">More </span>Info</button>
      </div>
      <section class="py-grid" style="--btn:${s.btn};--btn-edge:${s.edge}">${c.packages.map((p) => card(p, k)).join('')}</section>`;
    }).join('');
  }

  function cartCount() { return (basket?.packages || []).reduce((n, p) => n + (p.in_basket?.quantity || 1), 0); }
  function updateUser() {
    const top = $('#topRight');
    if (user) {
      const n = cartCount();
      top.innerHTML = `${ICON.cart} <span>Cart</span>${n ? `<i class="py-count">${n}</i>` : ''}`;
      $('#loginTitle').textContent = user;
      $('#loginSub').textContent = 'Click to change player';
      $('#loginImg').src = 'https://mc-heads.net/body/' + encodeURIComponent(user.replace(/^\./, '')) + '/120';
    } else {
      top.innerHTML = `${ICON.user} <span>Login</span>`;
      $('#loginTitle').textContent = 'Log in';
      $('#loginSub').textContent = 'to start shopping';
      $('#loginImg').src = 'images/ranks/flame.png';
    }
  }
  $('#loginImg').addEventListener('error', function () { if (!this.src.endsWith('flame.png')) this.src = 'images/ranks/flame.png'; });

  function renderCart() {
    const list = $('#cartList');
    const items = basket?.packages || [];
    list.innerHTML = items.length ? items.map((p) => `<div class="py-line">
        <img src="${esc(p.image || pkgs[p.id]?.image || extra(pkgs[p.id] || p).img || 'images/pyrra_smp_logo.png')}" alt="">
        <div><b>${esc(p.name)}</b><span>${p.in_basket?.quantity || 1}x &middot; ${money(p.in_basket?.price ?? 0, basket.currency)}</span></div>
        <button type="button" class="py-del" data-remove="${esc(p.id)}" aria-label="Remove">${ICON.trash}</button>
      </div>`).join('') : '<p class="py-center py-note">Your cart is empty.</p>';
    $('#cartTotal').textContent = money(basket?.total_price ?? 0, basket?.currency);
    $('#cartUser').textContent = user || '';
    $('#checkoutBtn').disabled = !items.length;
  }

  // ---------- package popup ----------
  function selectedQty(id) {
    const b = document.querySelector(`.py-card[data-id="${CSS.escape(String(id))}"] .py-qty .on`);
    return b ? parseInt(b.dataset.q, 10) : 1;
  }
  function openPkg(id) {
    const p = pkgs[id]; if (!p) return;
    const x = extra(p);
    $('#m-img').src = p.image || x.img || 'images/pyrra_smp_logo.png';
    $('#m-name').textContent = p.name; $('#m-name').style.color = x.color || '';
    const q = selectedQty(id);
    $('#m-price').textContent = money(p.total_price * q, p.currency) + (q > 1 ? ` (${q}x)` : '');
    $('#m-desc').innerHTML = DESC[x.desc] || p.description || '';
    const add = $('#m-add');
    add.dataset.add = id; add.dataset.qty = q; add.innerHTML = `${ICON.cart} Add to cart`;
    const grid = document.querySelector(`.py-card[data-id="${CSS.escape(String(id))}"]`)?.closest('.py-grid');
    if (grid) { add.style.setProperty('--btn', grid.style.getPropertyValue('--btn')); add.style.setProperty('--btn-edge', grid.style.getPropertyValue('--btn-edge')); }
    openModal('pkg');
  }

  // ---------- login / basket ----------
  let pending = null; // add waiting for login
  function openLogin() { $('#userIn').value = user || ''; previewHead(); openModal('login'); setTimeout(() => $('#userIn').focus(), 60); }
  function previewHead() {
    const v = $('#userIn').value.trim().replace(/^\./, '');
    $('#loginHead').src = /^[A-Za-z0-9_]{3,16}$/.test(v) ? 'https://mc-heads.net/avatar/' + v + '/80' : 'images/ranks/flame.png';
  }
  $('#loginHead').addEventListener('error', function () { if (!this.src.endsWith('flame.png')) this.src = 'images/ranks/flame.png'; });

  async function ensureBasket() {
    if (basket && !basket.complete) return basket;
    const ident = store.get('basket');
    basket = null;
    if (ident) { try { const b = await api(`/accounts/${C.token}/baskets/${ident}`); if (!b.complete) basket = b; } catch (e) { /* expired */ } }
    if (!basket) {
      basket = await api(`/accounts/${C.token}/baskets`, { method: 'POST', body: { complete_url: here() + '?done=1', cancel_url: here(), complete_auto_redirect: true, username: user } });
      store.set('basket', basket.ident);
    }
    if (!basket.username) { // Tebex asks the player to confirm their name on its own page, then sends them back
      const links = await api(`/accounts/${C.token}/baskets/${basket.ident}/auth?returnUrl=${encodeURIComponent(here() + '?auth=1')}`);
      const url = Array.isArray(links) ? links[0]?.url : links?.url;
      if (url) { if (pending) store.set('pending', JSON.stringify(pending)); location.href = url; throw new Error('redirect'); }
    }
    return basket;
  }

  async function add(id, qty) {
    const p = pkgs[id];
    if (DEMO) { toast('Demo mode: the store is not connected to Tebex yet.'); return; }
    if (!user) { pending = { id, qty }; openLogin(); return; }
    pending = { id, qty };
    document.body.classList.add('py-busy');
    try {
      await ensureBasket();
      basket = await api(`/baskets/${basket.ident}/packages`, { method: 'POST', body: { package_id: Number(id), quantity: qty } });
      pending = null;
      updateUser();
      toast(`Added to cart: ${qty > 1 ? qty + 'x ' : ''}${p?.name || 'item'}`);
    } catch (e) {
      if (e.message !== 'redirect') { pending = null; toast(e.message); }
    } finally { document.body.classList.remove('py-busy'); }
  }

  async function remove(id) {
    document.body.classList.add('py-busy');
    try { basket = await api(`/baskets/${basket.ident}/packages/remove`, { method: 'POST', body: { package_id: Number(id) } }); renderCart(); updateUser(); }
    catch (e) { toast(e.message); }
    finally { document.body.classList.remove('py-busy'); }
  }

  function setUser(v) {
    if (user && v.toLowerCase() !== user.toLowerCase()) { basket = null; store.set('basket', null); }
    user = v; store.set('user', v); updateUser();
  }
  function logout() { user = null; basket = null; store.set('user', null); store.set('basket', null); updateUser(); closeModal('cart'); openLogin(); }

  // ---------- events ----------
  document.addEventListener('click', (e) => {
    const t = e.target;
    const m = t.closest('.py-modal');
    if (m && (t === m || t.closest('[data-close]'))) { m.classList.remove('open'); return; }
    const q = t.closest('.py-qty button');
    if (q) {
      const row = q.parentNode; row.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === q));
      const cardEl = q.closest('.py-card'); const p = pkgs[cardEl.dataset.id];
      cardEl.querySelector('.price').textContent = money(p.total_price * parseInt(q.dataset.q, 10), p.currency);
      return;
    }
    const a = t.closest('[data-add]');
    if (a) { const id = a.dataset.add; closeModal('pkg'); add(id, a.dataset.qty ? parseInt(a.dataset.qty, 10) : selectedQty(id)); return; }
    const o = t.closest('[data-open]'); if (o) { openPkg(o.dataset.open); return; }
    const r = t.closest('[data-remove]'); if (r) { remove(r.dataset.remove); return; }
    const i = t.closest('[data-info]');
    if (i) {
      const c = cats.find((x) => String(x.id) === i.dataset.info); const k = kind(c);
      const [title, body] = INFO[k] || [(c.name || '').toUpperCase(), c.description || '<p>Everything here is for the Hardcore realm.</p>'];
      $('#i-title').textContent = title; $('#i-body').innerHTML = body; openModal('info'); return;
    }
    if (t.closest('[data-top]') || t.closest('#homeLink')) { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (t.closest('#catBtn')) { $('.py-cats').classList.toggle('open'); return; }
    if (t.closest('#catMenu a')) { $('.py-cats').classList.remove('open'); return; }
    if (!t.closest('.py-cats')) $('.py-cats').classList.remove('open');
    if (t.closest('#loginBox')) { openLogin(); return; }
    if (t.closest('#topRight')) { if (user) { renderCart(); openModal('cart'); } else openLogin(); return; }
    if (t.closest('#changeUser')) { e.preventDefault(); logout(); return; }
    if (t.closest('#checkoutBtn')) { if (basket?.links?.checkout) location.href = basket.links.checkout; return; }
    if (t.closest('#scrollBtn')) scrollBy({ top: innerHeight * 0.8, behavior: 'smooth' });
  });
  $('#loginBox').addEventListener('keydown', (e) => { if (e.key === 'Enter') openLogin(); });
  $('#userIn').addEventListener('input', previewHead);
  $('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#userIn').value.trim();
    if (!/^\.?[A-Za-z0-9_]{3,16}$/.test(v)) { toast('That is not a valid Minecraft username.'); return; }
    setUser(v); closeModal('login');
    if (pending) { const p = pending; pending = null; add(p.id, p.qty); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.py-modal.open').forEach((m) => m.classList.remove('open')); });
  const sb = $('#scrollBtn');
  addEventListener('scroll', () => sb.classList.toggle('hide', innerHeight + scrollY > document.body.scrollHeight - 200), { passive: true });

  // ---------- start ----------
  async function start() {
    if (C.discord) for (const id of ['#topDiscord', '#footDiscord']) { const l = $(id); l.href = C.discord; l.hidden = false; }
    const qs = new URLSearchParams(location.search);
    if (qs.has('done')) { store.set('basket', null); toast('Thanks for your purchase! Items arrive in-game within a minute.'); }
    if (qs.has('done') || qs.has('auth')) history.replaceState(null, '', here() + location.hash);
    updateUser();
    try {
      const data = DEMO ? (window.PYRRA_DEMO || []) : await api(`/accounts/${C.token}/categories?includePackages=1`);
      cats = (Array.isArray(data) ? data : []).filter((c) => (c.packages || []).length).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      cats.forEach((c) => c.packages.forEach((p) => { pkgs[p.id] = p; }));
      render();
    } catch (e) {
      $('#cats').innerHTML = `<p class="py-loading">The store could not load (${esc(e.message)}). Please refresh in a minute.</p>`;
    }
    if (!DEMO && user && store.get('basket')) {
      try { const b = await api(`/accounts/${C.token}/baskets/${store.get('basket')}`); if (b.complete) store.set('basket', null); else basket = b; } catch (e) { store.set('basket', null); }
      updateUser();
      const saved = store.get('pending');
      if (saved && qs.has('auth')) { store.set('pending', null); try { const p = JSON.parse(saved); add(p.id, p.qty); } catch (e) { /* ignore */ } }
    }
    const h = location.hash;
    if (h.startsWith('#open=')) openPkg(decodeURIComponent(h.slice(6)));
    else if (h === '#login') openLogin();
    else if (h.startsWith('#info=')) document.querySelector(`[data-info="${CSS.escape(h.slice(6))}"]`)?.click();
  }
  start();
})();
