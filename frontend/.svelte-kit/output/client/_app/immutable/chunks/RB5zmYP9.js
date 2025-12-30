import { aS as x, a as O, s as N, G as te, b7 as Be, b8 as yt } from './6VQ_8qfV.js';
import { w as Re, o as Fe } from './DY5-1jsb.js';
class fe {
  constructor(t, n) {
    ((this.status = t),
      typeof n == 'string'
        ? (this.body = { message: n })
        : n
          ? (this.body = n)
          : (this.body = { message: `Error: ${t}` }));
  }
  toString() {
    return JSON.stringify(this.body);
  }
}
class Te {
  constructor(t, n) {
    ((this.status = t), (this.location = n));
  }
}
class Ie extends Error {
  constructor(t, n, a) {
    (super(a), (this.status = t), (this.text = n));
  }
}
new URL('sveltekit-internal://');
function wt(e, t) {
  return e === '/' || t === 'ignore'
    ? e
    : t === 'never'
      ? e.endsWith('/')
        ? e.slice(0, -1)
        : e
      : t === 'always' && !e.endsWith('/')
        ? e + '/'
        : e;
}
function vt(e) {
  return e.split('%25').map(decodeURI).join('%25');
}
function bt(e) {
  for (const t in e) e[t] = decodeURIComponent(e[t]);
  return e;
}
function me({ href: e }) {
  return e.split('#')[0];
}
function kt(...e) {
  let t = 5381;
  for (const n of e)
    if (typeof n == 'string') {
      let a = n.length;
      for (; a; ) t = (t * 33) ^ n.charCodeAt(--a);
    } else if (ArrayBuffer.isView(n)) {
      const a = new Uint8Array(n.buffer, n.byteOffset, n.byteLength);
      let r = a.length;
      for (; r; ) t = (t * 33) ^ a[--r];
    } else throw new TypeError('value must be a string or TypedArray');
  return (t >>> 0).toString(36);
}
new TextEncoder();
const St = new TextDecoder();
function Et(e) {
  const t = atob(e),
    n = new Uint8Array(t.length);
  for (let a = 0; a < t.length; a++) n[a] = t.charCodeAt(a);
  return n;
}
const At = window.fetch;
window.fetch = (e, t) => (
  (e instanceof Request ? e.method : t?.method || 'GET') !== 'GET' && W.delete(Ue(e)),
  At(e, t)
);
const W = new Map();
function Rt(e, t) {
  const n = Ue(e, t),
    a = document.querySelector(n);
  if (a?.textContent) {
    a.remove();
    let { body: r, ...s } = JSON.parse(a.textContent);
    const i = a.getAttribute('data-ttl');
    return (
      i && W.set(n, { body: r, init: s, ttl: 1e3 * Number(i) }),
      a.getAttribute('data-b64') !== null && (r = Et(r)),
      Promise.resolve(new Response(r, s))
    );
  }
  return window.fetch(e, t);
}
function Tt(e, t, n) {
  if (W.size > 0) {
    const a = Ue(e, n),
      r = W.get(a);
    if (r) {
      if (
        performance.now() < r.ttl &&
        ['default', 'force-cache', 'only-if-cached', void 0].includes(n?.cache)
      )
        return new Response(r.body, r.init);
      W.delete(a);
    }
  }
  return window.fetch(t, n);
}
function Ue(e, t) {
  let a = `script[data-sveltekit-fetched][data-url=${JSON.stringify(e instanceof Request ? e.url : e)}]`;
  if (t?.headers || t?.body) {
    const r = [];
    (t.headers && r.push([...new Headers(t.headers)].join(',')),
      t.body && (typeof t.body == 'string' || ArrayBuffer.isView(t.body)) && r.push(t.body),
      (a += `[data-hash="${kt(...r)}"]`));
  }
  return a;
}
const It = /^(\[)?(\.\.\.)?(\w+)(?:=(\w+))?(\])?$/;
function Ut(e) {
  const t = [];
  return {
    pattern:
      e === '/'
        ? /^\/$/
        : new RegExp(
            `^${Ct(e)
              .map((a) => {
                const r = /^\[\.\.\.(\w+)(?:=(\w+))?\]$/.exec(a);
                if (r)
                  return (
                    t.push({ name: r[1], matcher: r[2], optional: !1, rest: !0, chained: !0 }),
                    '(?:/([^]*))?'
                  );
                const s = /^\[\[(\w+)(?:=(\w+))?\]\]$/.exec(a);
                if (s)
                  return (
                    t.push({ name: s[1], matcher: s[2], optional: !0, rest: !1, chained: !0 }),
                    '(?:/([^/]+))?'
                  );
                if (!a) return;
                const i = a.split(/\[(.+?)\](?!\])/);
                return (
                  '/' +
                  i
                    .map((c, f) => {
                      if (f % 2) {
                        if (c.startsWith('x+'))
                          return ye(String.fromCharCode(parseInt(c.slice(2), 16)));
                        if (c.startsWith('u+'))
                          return ye(
                            String.fromCharCode(
                              ...c
                                .slice(2)
                                .split('-')
                                .map((v) => parseInt(v, 16))
                            )
                          );
                        const u = It.exec(c),
                          [, h, p, l, d] = u;
                        return (
                          t.push({
                            name: l,
                            matcher: d,
                            optional: !!h,
                            rest: !!p,
                            chained: p ? f === 1 && i[0] === '' : !1,
                          }),
                          p ? '([^]*?)' : h ? '([^/]*)?' : '([^/]+?)'
                        );
                      }
                      return ye(c);
                    })
                    .join('')
                );
              })
              .join('')}/?$`
          ),
    params: t,
  };
}
function Lt(e) {
  return e !== '' && !/^\([^)]+\)$/.test(e);
}
function Ct(e) {
  return e.slice(1).split('/').filter(Lt);
}
function Pt(e, t, n) {
  const a = {},
    r = e.slice(1),
    s = r.filter((o) => o !== void 0);
  let i = 0;
  for (let o = 0; o < t.length; o += 1) {
    const c = t[o];
    let f = r[o - i];
    if (
      (c.chained &&
        c.rest &&
        i &&
        ((f = r
          .slice(o - i, o + 1)
          .filter((u) => u)
          .join('/')),
        (i = 0)),
      f === void 0)
    ) {
      c.rest && (a[c.name] = '');
      continue;
    }
    if (!c.matcher || n[c.matcher](f)) {
      a[c.name] = f;
      const u = t[o + 1],
        h = r[o + 1];
      (u && !u.rest && u.optional && h && c.chained && (i = 0),
        !u && !h && Object.keys(a).length === s.length && (i = 0));
      continue;
    }
    if (c.optional && c.chained) {
      i++;
      continue;
    }
    return;
  }
  if (!i) return a;
}
function ye(e) {
  return e
    .normalize()
    .replace(/[[\]]/g, '\\$&')
    .replace(/%/g, '%25')
    .replace(/\//g, '%2[Ff]')
    .replace(/\?/g, '%3[Ff]')
    .replace(/#/g, '%23')
    .replace(/[.*+?^${}()|\\]/g, '\\$&');
}
function xt({ nodes: e, server_loads: t, dictionary: n, matchers: a }) {
  const r = new Set(t);
  return Object.entries(n).map(([o, [c, f, u]]) => {
    const { pattern: h, params: p } = Ut(o),
      l = {
        id: o,
        exec: (d) => {
          const v = h.exec(d);
          if (v) return Pt(v, p, a);
        },
        errors: [1, ...(u || [])].map((d) => e[d]),
        layouts: [0, ...(f || [])].map(i),
        leaf: s(c),
      };
    return ((l.errors.length = l.layouts.length = Math.max(l.errors.length, l.layouts.length)), l);
  });
  function s(o) {
    const c = o < 0;
    return (c && (o = ~o), [c, e[o]]);
  }
  function i(o) {
    return o === void 0 ? o : [r.has(o), e[o]];
  }
}
function Je(e, t = JSON.parse) {
  try {
    return t(sessionStorage[e]);
  } catch {}
}
function Ve(e, t, n = JSON.stringify) {
  const a = n(t);
  try {
    sessionStorage[e] = a;
  } catch {}
}
const L = globalThis.__sveltekit_856iya?.base ?? '',
  Ot = globalThis.__sveltekit_856iya?.assets ?? L ?? '',
  Nt = '1767100412754',
  Xe = 'sveltekit:snapshot',
  Ze = 'sveltekit:scroll',
  Qe = 'sveltekit:states',
  jt = 'sveltekit:pageurl',
  M = 'sveltekit:history',
  J = 'sveltekit:navigation',
  D = { tap: 1, hover: 2, viewport: 3, eager: 4, off: -1, false: -1 },
  ue = location.origin;
function et(e) {
  if (e instanceof URL) return e;
  let t = document.baseURI;
  if (!t) {
    const n = document.getElementsByTagName('base');
    t = n.length ? n[0].href : document.URL;
  }
  return new URL(e, t);
}
function de() {
  return { x: pageXOffset, y: pageYOffset };
}
function V(e, t) {
  return e.getAttribute(`data-sveltekit-${t}`);
}
const Me = { ...D, '': D.hover };
function tt(e) {
  let t = e.assignedSlot ?? e.parentNode;
  return (t?.nodeType === 11 && (t = t.host), t);
}
function nt(e, t) {
  for (; e && e !== t; ) {
    if (e.nodeName.toUpperCase() === 'A' && e.hasAttribute('href')) return e;
    e = tt(e);
  }
}
function be(e, t, n) {
  let a;
  try {
    if (
      ((a = new URL(e instanceof SVGAElement ? e.href.baseVal : e.href, document.baseURI)),
      n && a.hash.match(/^#[^/]/))
    ) {
      const o = location.hash.split('#')[1] || '/';
      a.hash = `#${o}${a.hash}`;
    }
  } catch {}
  const r = e instanceof SVGAElement ? e.target.baseVal : e.target,
    s = !a || !!r || he(a, t, n) || (e.getAttribute('rel') || '').split(/\s+/).includes('external'),
    i = a?.origin === ue && e.hasAttribute('download');
  return { url: a, external: s, target: r, download: i };
}
function ne(e) {
  let t = null,
    n = null,
    a = null,
    r = null,
    s = null,
    i = null,
    o = e;
  for (; o && o !== document.documentElement; )
    (a === null && (a = V(o, 'preload-code')),
      r === null && (r = V(o, 'preload-data')),
      t === null && (t = V(o, 'keepfocus')),
      n === null && (n = V(o, 'noscroll')),
      s === null && (s = V(o, 'reload')),
      i === null && (i = V(o, 'replacestate')),
      (o = tt(o)));
  function c(f) {
    switch (f) {
      case '':
      case 'true':
        return !0;
      case 'off':
      case 'false':
        return !1;
      default:
        return;
    }
  }
  return {
    preload_code: Me[a ?? 'off'],
    preload_data: Me[r ?? 'off'],
    keepfocus: c(t),
    noscroll: c(n),
    reload: c(s),
    replace_state: c(i),
  };
}
function qe(e) {
  const t = Re(e);
  let n = !0;
  function a() {
    ((n = !0), t.update((i) => i));
  }
  function r(i) {
    ((n = !1), t.set(i));
  }
  function s(i) {
    let o;
    return t.subscribe((c) => {
      (o === void 0 || (n && c !== o)) && i((o = c));
    });
  }
  return { notify: a, set: r, subscribe: s };
}
const at = { v: () => {} };
function $t() {
  const { set: e, subscribe: t } = Re(!1);
  let n;
  async function a() {
    clearTimeout(n);
    try {
      const r = await fetch(`${Ot}/_app/version.json`, {
        headers: { pragma: 'no-cache', 'cache-control': 'no-cache' },
      });
      if (!r.ok) return !1;
      const i = (await r.json()).version !== Nt;
      return (i && (e(!0), at.v(), clearTimeout(n)), i);
    } catch {
      return !1;
    }
  }
  return { subscribe: t, check: a };
}
function he(e, t, n) {
  return e.origin !== ue || !e.pathname.startsWith(t)
    ? !0
    : n
      ? e.pathname !== location.pathname
      : !1;
}
function Sn(e) {}
function Dt(e) {
  const t = Ft(e),
    n = new ArrayBuffer(t.length),
    a = new DataView(n);
  for (let r = 0; r < n.byteLength; r++) a.setUint8(r, t.charCodeAt(r));
  return n;
}
const Bt = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function Ft(e) {
  e.length % 4 === 0 && (e = e.replace(/==?$/, ''));
  let t = '',
    n = 0,
    a = 0;
  for (let r = 0; r < e.length; r++)
    ((n <<= 6),
      (n |= Bt.indexOf(e[r])),
      (a += 6),
      a === 24 &&
        ((t += String.fromCharCode((n & 16711680) >> 16)),
        (t += String.fromCharCode((n & 65280) >> 8)),
        (t += String.fromCharCode(n & 255)),
        (n = a = 0)));
  return (
    a === 12
      ? ((n >>= 4), (t += String.fromCharCode(n)))
      : a === 18 &&
        ((n >>= 2),
        (t += String.fromCharCode((n & 65280) >> 8)),
        (t += String.fromCharCode(n & 255))),
    t
  );
}
const Vt = -1,
  Mt = -2,
  qt = -3,
  Gt = -4,
  Yt = -5,
  Kt = -6;
function Wt(e, t) {
  if (typeof e == 'number') return r(e, !0);
  if (!Array.isArray(e) || e.length === 0) throw new Error('Invalid input');
  const n = e,
    a = Array(n.length);
  function r(s, i = !1) {
    if (s === Vt) return;
    if (s === qt) return NaN;
    if (s === Gt) return 1 / 0;
    if (s === Yt) return -1 / 0;
    if (s === Kt) return -0;
    if (i || typeof s != 'number') throw new Error('Invalid input');
    if (s in a) return a[s];
    const o = n[s];
    if (!o || typeof o != 'object') a[s] = o;
    else if (Array.isArray(o))
      if (typeof o[0] == 'string') {
        const c = o[0],
          f = t && Object.hasOwn(t, c) ? t[c] : void 0;
        if (f) {
          let u = o[1];
          return (typeof u != 'number' && (u = n.push(o[1]) - 1), (a[s] = f(r(u))));
        }
        switch (c) {
          case 'Date':
            a[s] = new Date(o[1]);
            break;
          case 'Set':
            const u = new Set();
            a[s] = u;
            for (let l = 1; l < o.length; l += 1) u.add(r(o[l]));
            break;
          case 'Map':
            const h = new Map();
            a[s] = h;
            for (let l = 1; l < o.length; l += 2) h.set(r(o[l]), r(o[l + 1]));
            break;
          case 'RegExp':
            a[s] = new RegExp(o[1], o[2]);
            break;
          case 'Object':
            a[s] = Object(o[1]);
            break;
          case 'BigInt':
            a[s] = BigInt(o[1]);
            break;
          case 'null':
            const p = Object.create(null);
            a[s] = p;
            for (let l = 1; l < o.length; l += 2) p[o[l]] = r(o[l + 1]);
            break;
          case 'Int8Array':
          case 'Uint8Array':
          case 'Uint8ClampedArray':
          case 'Int16Array':
          case 'Uint16Array':
          case 'Int32Array':
          case 'Uint32Array':
          case 'Float32Array':
          case 'Float64Array':
          case 'BigInt64Array':
          case 'BigUint64Array': {
            const l = globalThis[c],
              d = new l(r(o[1]));
            a[s] = o[2] !== void 0 ? d.subarray(o[2], o[3]) : d;
            break;
          }
          case 'ArrayBuffer': {
            const l = o[1],
              d = Dt(l);
            a[s] = d;
            break;
          }
          case 'Temporal.Duration':
          case 'Temporal.Instant':
          case 'Temporal.PlainDate':
          case 'Temporal.PlainTime':
          case 'Temporal.PlainDateTime':
          case 'Temporal.PlainMonthDay':
          case 'Temporal.PlainYearMonth':
          case 'Temporal.ZonedDateTime': {
            const l = c.slice(9);
            a[s] = Temporal[l].from(o[1]);
            break;
          }
          case 'URL': {
            const l = new URL(o[1]);
            a[s] = l;
            break;
          }
          case 'URLSearchParams': {
            const l = new URLSearchParams(o[1]);
            a[s] = l;
            break;
          }
          default:
            throw new Error(`Unknown type ${c}`);
        }
      } else {
        const c = new Array(o.length);
        a[s] = c;
        for (let f = 0; f < o.length; f += 1) {
          const u = o[f];
          u !== Mt && (c[f] = r(u));
        }
      }
    else {
      const c = {};
      a[s] = c;
      for (const f in o) {
        if (f === '__proto__')
          throw new Error('Cannot parse an object with a `__proto__` property');
        const u = o[f];
        c[f] = r(u);
      }
    }
    return a[s];
  }
  return r(0);
}
const rt = new Set(['load', 'prerender', 'csr', 'ssr', 'trailingSlash', 'config']);
[...rt];
const Ht = new Set([...rt]);
[...Ht];
function zt(e) {
  return e.filter((t) => t != null);
}
const Jt = 'x-sveltekit-invalidated',
  Xt = 'x-sveltekit-trailing-slash';
function ae(e) {
  return e instanceof fe || e instanceof Ie ? e.status : 500;
}
function Zt(e) {
  return e instanceof Ie ? e.text : 'Internal Error';
}
let R, X, we;
const Qt = Fe.toString().includes('$$') || /function \w+\(\) \{\}/.test(Fe.toString());
Qt
  ? ((R = {
      data: {},
      form: null,
      error: null,
      params: {},
      route: { id: null },
      state: {},
      status: -1,
      url: new URL('https://example.com'),
    }),
    (X = { current: null }),
    (we = { current: !1 }))
  : ((R = new (class {
      #e = x({});
      get data() {
        return O(this.#e);
      }
      set data(t) {
        N(this.#e, t);
      }
      #t = x(null);
      get form() {
        return O(this.#t);
      }
      set form(t) {
        N(this.#t, t);
      }
      #n = x(null);
      get error() {
        return O(this.#n);
      }
      set error(t) {
        N(this.#n, t);
      }
      #a = x({});
      get params() {
        return O(this.#a);
      }
      set params(t) {
        N(this.#a, t);
      }
      #r = x({ id: null });
      get route() {
        return O(this.#r);
      }
      set route(t) {
        N(this.#r, t);
      }
      #o = x({});
      get state() {
        return O(this.#o);
      }
      set state(t) {
        N(this.#o, t);
      }
      #s = x(-1);
      get status() {
        return O(this.#s);
      }
      set status(t) {
        N(this.#s, t);
      }
      #i = x(new URL('https://example.com'));
      get url() {
        return O(this.#i);
      }
      set url(t) {
        N(this.#i, t);
      }
    })()),
    (X = new (class {
      #e = x(null);
      get current() {
        return O(this.#e);
      }
      set current(t) {
        N(this.#e, t);
      }
    })()),
    (we = new (class {
      #e = x(!1);
      get current() {
        return O(this.#e);
      }
      set current(t) {
        N(this.#e, t);
      }
    })()),
    (at.v = () => (we.current = !0)));
function ot(e) {
  Object.assign(R, e);
}
const en = '/__data.json',
  tn = '.html__data.json';
function nn(e) {
  return e.endsWith('.html') ? e.replace(/\.html$/, tn) : e.replace(/\/$/, '') + en;
}
const an = new Set(['icon', 'shortcut icon', 'apple-touch-icon']),
  F = Je(Ze) ?? {},
  Z = Je(Xe) ?? {},
  $ = { url: qe({}), page: qe({}), navigating: Re(null), updated: $t() };
function Le(e) {
  F[e] = de();
}
function rn(e, t) {
  let n = e + 1;
  for (; F[n]; ) (delete F[n], (n += 1));
  for (n = t + 1; Z[n]; ) (delete Z[n], (n += 1));
}
function Y(e, t = !1) {
  return (t ? location.replace(e.href) : (location.href = e.href), new Promise(() => {}));
}
async function st() {
  if ('serviceWorker' in navigator) {
    const e = await navigator.serviceWorker.getRegistration(L || '/');
    e && (await e.update());
  }
}
function Ge() {}
let Ce, ke, re, j, Se, k;
const oe = [],
  se = [];
let T = null;
function Ee() {
  (T?.fork?.then((e) => e?.discard()), (T = null));
}
const ee = new Map(),
  it = new Set(),
  on = new Set(),
  H = new Set();
let m = { branch: [], error: null, url: null },
  Pe = !1,
  ie = !1,
  Ye = !0,
  Q = !1,
  K = !1,
  ct = !1,
  xe = !1,
  Oe,
  A,
  U,
  B;
const z = new Set(),
  Ke = new Map();
async function Tn(e, t, n) {
  (globalThis.__sveltekit_856iya?.data && globalThis.__sveltekit_856iya.data,
    document.URL !== location.href && (location.href = location.href),
    (k = e),
    await e.hooks.init?.(),
    (Ce = xt(e)),
    (j = document.documentElement),
    (Se = t),
    (ke = e.nodes[0]),
    (re = e.nodes[1]),
    ke(),
    re(),
    (A = history.state?.[M]),
    (U = history.state?.[J]),
    A || ((A = U = Date.now()), history.replaceState({ ...history.state, [M]: A, [J]: U }, '')));
  const a = F[A];
  function r() {
    a && ((history.scrollRestoration = 'manual'), scrollTo(a.x, a.y));
  }
  (n
    ? (r(), await yn(Se, n))
    : (await q({
        type: 'enter',
        url: et(k.hash ? vn(new URL(location.href)) : location.href),
        replace_state: !0,
      }),
      r()),
    mn());
}
function sn() {
  ((oe.length = 0), (xe = !1));
}
function lt(e) {
  se.some((t) => t?.snapshot) && (Z[e] = se.map((t) => t?.snapshot?.capture()));
}
function ft(e) {
  Z[e]?.forEach((t, n) => {
    se[n]?.snapshot?.restore(t);
  });
}
function We() {
  (Le(A), Ve(Ze, F), lt(U), Ve(Xe, Z));
}
async function cn(e, t, n, a) {
  let r;
  (t.invalidateAll && Ee(),
    await q({
      type: 'goto',
      url: et(e),
      keepfocus: t.keepFocus,
      noscroll: t.noScroll,
      replace_state: t.replaceState,
      state: t.state,
      redirect_count: n,
      nav_token: a,
      accept: () => {
        (t.invalidateAll && ((xe = !0), (r = [...Ke.keys()])),
          t.invalidate && t.invalidate.forEach(gn));
      },
    }),
    t.invalidateAll &&
      te()
        .then(te)
        .then(() => {
          Ke.forEach(({ resource: s }, i) => {
            r?.includes(i) && s.refresh?.();
          });
        }));
}
async function ln(e) {
  if (e.id !== T?.id) {
    Ee();
    const t = {};
    if (
      (z.add(t),
      (T = {
        id: e.id,
        token: t,
        promise: dt({ ...e, preload: t }).then(
          (n) => (z.delete(t), n.type === 'loaded' && n.state.error && Ee(), n)
        ),
        fork: null,
      }),
      Be)
    ) {
      const n = T;
      n.fork = n.promise.then((a) => {
        if (n === T && a.type === 'loaded')
          try {
            return Be(() => {
              (Oe.$set(a.props), ot(a.props.page));
            });
          } catch {}
        return null;
      });
    }
  }
  return T.promise;
}
async function ve(e) {
  const t = (await _e(e, !1))?.route;
  t && (await Promise.all([...t.layouts, t.leaf].map((n) => n?.[1]())));
}
async function ut(e, t, n) {
  m = e.state;
  const a = document.querySelector('style[data-sveltekit]');
  if (
    (a && a.remove(),
    Object.assign(R, e.props.page),
    (Oe = new k.root({
      target: t,
      props: { ...e.props, stores: $, components: se },
      hydrate: n,
      sync: !1,
    })),
    await Promise.resolve(),
    ft(U),
    n)
  ) {
    const r = {
      from: null,
      to: { params: m.params, route: { id: m.route?.id ?? null }, url: new URL(location.href) },
      willUnload: !1,
      type: 'enter',
      complete: Promise.resolve(),
    };
    H.forEach((s) => s(r));
  }
  ie = !0;
}
function ce({ url: e, params: t, branch: n, status: a, error: r, route: s, form: i }) {
  let o = 'never';
  if (L && (e.pathname === L || e.pathname === L + '/')) o = 'always';
  else for (const l of n) l?.slash !== void 0 && (o = l.slash);
  ((e.pathname = wt(e.pathname, o)), (e.search = e.search));
  const c = {
    type: 'loaded',
    state: { url: e, params: t, branch: n, error: r, route: s },
    props: { constructors: zt(n).map((l) => l.node.component), page: De(R) },
  };
  i !== void 0 && (c.props.form = i);
  let f = {},
    u = !R,
    h = 0;
  for (let l = 0; l < Math.max(n.length, m.branch.length); l += 1) {
    const d = n[l],
      v = m.branch[l];
    (d?.data !== v?.data && (u = !0),
      d && ((f = { ...f, ...d.data }), u && (c.props[`data_${h}`] = f), (h += 1)));
  }
  return (
    (!m.url || e.href !== m.url.href || m.error !== r || (i !== void 0 && i !== R.form) || u) &&
      (c.props.page = {
        error: r,
        params: t,
        route: { id: s?.id ?? null },
        state: {},
        status: a,
        url: new URL(e),
        form: i ?? null,
        data: u ? f : R.data,
      }),
    c
  );
}
async function Ne({ loader: e, parent: t, url: n, params: a, route: r, server_data_node: s }) {
  let i = null;
  const o = {
      dependencies: new Set(),
      params: new Set(),
      parent: !1,
      route: !1,
      url: !1,
      search_params: new Set(),
    },
    c = await e();
  return {
    node: c,
    loader: e,
    server: s,
    universal: c.universal?.load ? { type: 'data', data: i, uses: o } : null,
    data: i ?? s?.data ?? null,
    slash: c.universal?.trailingSlash ?? s?.slash,
  };
}
function fn(e, t, n) {
  let a = e instanceof Request ? e.url : e;
  const r = new URL(a, n);
  r.origin === n.origin && (a = r.href.slice(n.origin.length));
  const s = ie ? Tt(a, r.href, t) : Rt(a, t);
  return { resolved: r, promise: s };
}
function He(e, t, n, a, r, s) {
  if (xe) return !0;
  if (!r) return !1;
  if ((r.parent && e) || (r.route && t) || (r.url && n)) return !0;
  for (const i of r.search_params) if (a.has(i)) return !0;
  for (const i of r.params) if (s[i] !== m.params[i]) return !0;
  for (const i of r.dependencies) if (oe.some((o) => o(new URL(i)))) return !0;
  return !1;
}
function je(e, t) {
  return e?.type === 'data' ? e : e?.type === 'skip' ? (t ?? null) : null;
}
function un(e, t) {
  if (!e) return new Set(t.searchParams.keys());
  const n = new Set([...e.searchParams.keys(), ...t.searchParams.keys()]);
  for (const a of n) {
    const r = e.searchParams.getAll(a),
      s = t.searchParams.getAll(a);
    r.every((i) => s.includes(i)) && s.every((i) => r.includes(i)) && n.delete(a);
  }
  return n;
}
function ze({ error: e, url: t, route: n, params: a }) {
  return {
    type: 'loaded',
    state: { error: e, url: t, route: n, params: a, branch: [] },
    props: { page: De(R), constructors: [] },
  };
}
async function dt({ id: e, invalidating: t, url: n, params: a, route: r, preload: s }) {
  if (T?.id === e) return (z.delete(T.token), T.promise);
  const { errors: i, layouts: o, leaf: c } = r,
    f = [...o, c];
  (i.forEach((g) => g?.().catch(() => {})), f.forEach((g) => g?.[1]().catch(() => {})));
  let u = null;
  const h = m.url ? e !== le(m.url) : !1,
    p = m.route ? r.id !== m.route.id : !1,
    l = un(m.url, n);
  let d = !1;
  {
    const g = f.map((y, b) => {
      const E = m.branch[b],
        w = !!y?.[0] && (E?.loader !== y[1] || He(d, p, h, l, E.server?.uses, a));
      return (w && (d = !0), w);
    });
    if (g.some(Boolean)) {
      try {
        u = await _t(n, g);
      } catch (y) {
        const b = await G(y, { url: n, params: a, route: { id: e } });
        return z.has(s)
          ? ze({ error: b, url: n, params: a, route: r })
          : pe({ status: ae(y), error: b, url: n, route: r });
      }
      if (u.type === 'redirect') return u;
    }
  }
  const v = u?.nodes;
  let S = !1;
  const _ = f.map(async (g, y) => {
    if (!g) return;
    const b = m.branch[y],
      E = v?.[y];
    if ((!E || E.type === 'skip') && g[1] === b?.loader && !He(S, p, h, l, b.universal?.uses, a))
      return b;
    if (((S = !0), E?.type === 'error')) throw E;
    return Ne({
      loader: g[1],
      url: n,
      params: a,
      route: r,
      parent: async () => {
        const P = {};
        for (let I = 0; I < y; I += 1) Object.assign(P, (await _[I])?.data);
        return P;
      },
      server_data_node: je(
        E === void 0 && g[0] ? { type: 'skip' } : (E ?? null),
        g[0] ? b?.server : void 0
      ),
    });
  });
  for (const g of _) g.catch(() => {});
  const C = [];
  for (let g = 0; g < f.length; g += 1)
    if (f[g])
      try {
        C.push(await _[g]);
      } catch (y) {
        if (y instanceof Te) return { type: 'redirect', location: y.location };
        if (z.has(s))
          return ze({
            error: await G(y, { params: a, url: n, route: { id: r.id } }),
            url: n,
            params: a,
            route: r,
          });
        let b = ae(y),
          E;
        if (v?.includes(y)) ((b = y.status ?? b), (E = y.error));
        else if (y instanceof fe) E = y.body;
        else {
          if (await $.updated.check()) return (await st(), await Y(n));
          E = await G(y, { params: a, url: n, route: { id: r.id } });
        }
        const w = await dn(g, C, i);
        return w
          ? ce({
              url: n,
              params: a,
              branch: C.slice(0, w.idx).concat(w.node),
              status: b,
              error: E,
              route: r,
            })
          : await pt(n, { id: r.id }, E, b);
      }
    else C.push(void 0);
  return ce({
    url: n,
    params: a,
    branch: C,
    status: 200,
    error: null,
    route: r,
    form: t ? void 0 : null,
  });
}
async function dn(e, t, n) {
  for (; e--; )
    if (n[e]) {
      let a = e;
      for (; !t[a]; ) a -= 1;
      try {
        return {
          idx: a + 1,
          node: { node: await n[e](), loader: n[e], data: {}, server: null, universal: null },
        };
      } catch {
        continue;
      }
    }
}
async function pe({ status: e, error: t, url: n, route: a }) {
  const r = {};
  let s = null;
  if (k.server_loads[0] === 0)
    try {
      const o = await _t(n, [!0]);
      if (o.type !== 'data' || (o.nodes[0] && o.nodes[0].type !== 'data')) throw 0;
      s = o.nodes[0] ?? null;
    } catch {
      (n.origin !== ue || n.pathname !== location.pathname || Pe) && (await Y(n));
    }
  try {
    const i = await Ne({
        loader: ke,
        url: n,
        params: r,
        route: a,
        parent: () => Promise.resolve({}),
        server_data_node: je(s),
      }),
      o = { node: await re(), loader: re, universal: null, server: null, data: null };
    return ce({ url: n, params: r, branch: [i, o], status: e, error: t, route: null });
  } catch (i) {
    if (i instanceof Te) return cn(new URL(i.location, location.href), {}, 0);
    throw i;
  }
}
async function hn(e) {
  const t = e.href;
  if (ee.has(t)) return ee.get(t);
  let n;
  try {
    const a = (async () => {
      let r =
        (await k.hooks.reroute({ url: new URL(e), fetch: async (s, i) => fn(s, i, e).promise })) ??
        e;
      if (typeof r == 'string') {
        const s = new URL(e);
        (k.hash ? (s.hash = r) : (s.pathname = r), (r = s));
      }
      return r;
    })();
    (ee.set(t, a), (n = await a));
  } catch {
    ee.delete(t);
    return;
  }
  return n;
}
async function _e(e, t) {
  if (e && !he(e, L, k.hash)) {
    const n = await hn(e);
    if (!n) return;
    const a = pn(n);
    for (const r of Ce) {
      const s = r.exec(a);
      if (s) return { id: le(e), invalidating: t, route: r, params: bt(s), url: e };
    }
  }
}
function pn(e) {
  return (
    vt(k.hash ? e.hash.replace(/^#/, '').replace(/[?#].+/, '') : e.pathname.slice(L.length)) || '/'
  );
}
function le(e) {
  return (k.hash ? e.hash.replace(/^#/, '') : e.pathname) + e.search;
}
function ht({ url: e, type: t, intent: n, delta: a, event: r }) {
  let s = !1;
  const i = $e(m, n, e, t);
  (a !== void 0 && (i.navigation.delta = a), r !== void 0 && (i.navigation.event = r));
  const o = {
    ...i.navigation,
    cancel: () => {
      ((s = !0), i.reject(new Error('navigation cancelled')));
    },
  };
  return (Q || it.forEach((c) => c(o)), s ? null : i);
}
async function q({
  type: e,
  url: t,
  popped: n,
  keepfocus: a,
  noscroll: r,
  replace_state: s,
  state: i = {},
  redirect_count: o = 0,
  nav_token: c = {},
  accept: f = Ge,
  block: u = Ge,
  event: h,
}) {
  const p = B;
  B = c;
  const l = await _e(t, !1),
    d =
      e === 'enter'
        ? $e(m, l, t, e)
        : ht({ url: t, type: e, delta: n?.delta, intent: l, event: h });
  if (!d) {
    (u(), B === c && (B = p));
    return;
  }
  const v = A,
    S = U;
  (f(),
    (Q = !0),
    ie && d.navigation.type !== 'enter' && $.navigating.set((X.current = d.navigation)));
  let _ = l && (await dt(l));
  if (!_) {
    if (he(t, L, k.hash)) return await Y(t, s);
    _ = await pt(
      t,
      { id: null },
      await G(new Ie(404, 'Not Found', `Not found: ${t.pathname}`), {
        url: t,
        params: {},
        route: { id: null },
      }),
      404,
      s
    );
  }
  if (((t = l?.url || t), B !== c)) return (d.reject(new Error('navigation aborted')), !1);
  if (_.type === 'redirect') {
    if (o < 20) {
      (await q({
        type: e,
        url: new URL(_.location, t),
        popped: n,
        keepfocus: a,
        noscroll: r,
        replace_state: s,
        state: i,
        redirect_count: o + 1,
        nav_token: c,
      }),
        d.fulfil(void 0));
      return;
    }
    _ = await pe({
      status: 500,
      error: await G(new Error('Redirect loop'), { url: t, params: {}, route: { id: null } }),
      url: t,
      route: { id: null },
    });
  } else _.props.page.status >= 400 && (await $.updated.check()) && (await st(), await Y(t, s));
  if (
    (sn(),
    Le(v),
    lt(S),
    _.props.page.url.pathname !== t.pathname && (t.pathname = _.props.page.url.pathname),
    (i = n ? n.state : i),
    !n)
  ) {
    const w = s ? 0 : 1,
      P = { [M]: (A += w), [J]: (U += w), [Qe]: i };
    ((s ? history.replaceState : history.pushState).call(history, P, '', t), s || rn(A, U));
  }
  const C = l && T?.id === l.id ? T.fork : null;
  ((T = null), (_.props.page.state = i));
  let g;
  if (ie) {
    const w = (await Promise.all(Array.from(on, (I) => I(d.navigation)))).filter(
      (I) => typeof I == 'function'
    );
    if (w.length > 0) {
      let I = function () {
        w.forEach((ge) => {
          H.delete(ge);
        });
      };
      (w.push(I),
        w.forEach((ge) => {
          H.add(ge);
        }));
    }
    ((m = _.state), _.props.page && (_.props.page.url = t));
    const P = C && (await C);
    (P ? (g = P.commit()) : (Oe.$set(_.props), ot(_.props.page), (g = yt?.())), (ct = !0));
  } else await ut(_, Se, !1);
  const { activeElement: y } = document;
  (await g, await te(), await te());
  let b = n ? n.scroll : r ? de() : null;
  if (Ye) {
    const w = t.hash && document.getElementById(mt(t));
    if (b) scrollTo(b.x, b.y);
    else if (w) {
      w.scrollIntoView();
      const { top: P, left: I } = w.getBoundingClientRect();
      b = { x: pageXOffset + I, y: pageYOffset + P };
    } else scrollTo(0, 0);
  }
  const E = document.activeElement !== y && document.activeElement !== document.body;
  (!a && !E && wn(t, b),
    (Ye = !0),
    _.props.page && Object.assign(R, _.props.page),
    (Q = !1),
    e === 'popstate' && ft(U),
    d.fulfil(void 0),
    H.forEach((w) => w(d.navigation)),
    $.navigating.set((X.current = null)));
}
async function pt(e, t, n, a, r) {
  return e.origin === ue && e.pathname === location.pathname && !Pe
    ? await pe({ status: a, error: n, url: e, route: t })
    : await Y(e, r);
}
function _n() {
  let e, t, n;
  j.addEventListener('mousemove', (o) => {
    const c = o.target;
    (clearTimeout(e),
      (e = setTimeout(() => {
        s(c, D.hover);
      }, 20)));
  });
  function a(o) {
    o.defaultPrevented || s(o.composedPath()[0], D.tap);
  }
  (j.addEventListener('mousedown', a), j.addEventListener('touchstart', a, { passive: !0 }));
  const r = new IntersectionObserver(
    (o) => {
      for (const c of o) c.isIntersecting && (ve(new URL(c.target.href)), r.unobserve(c.target));
    },
    { threshold: 0 }
  );
  async function s(o, c) {
    const f = nt(o, j),
      u = f === t && c >= n;
    if (!f || u) return;
    const { url: h, external: p, download: l } = be(f, L, k.hash);
    if (p || l) return;
    const d = ne(f),
      v = h && le(m.url) === le(h);
    if (!(d.reload || v))
      if (c <= d.preload_data) {
        ((t = f), (n = D.tap));
        const S = await _e(h, !1);
        if (!S) return;
        ln(S);
      } else c <= d.preload_code && ((t = f), (n = c), ve(h));
  }
  function i() {
    r.disconnect();
    for (const o of j.querySelectorAll('a')) {
      const { url: c, external: f, download: u } = be(o, L, k.hash);
      if (f || u) continue;
      const h = ne(o);
      h.reload ||
        (h.preload_code === D.viewport && r.observe(o), h.preload_code === D.eager && ve(c));
    }
  }
  (H.add(i), i());
}
function G(e, t) {
  if (e instanceof fe) return e.body;
  const n = ae(e),
    a = Zt(e);
  return k.hooks.handleError({ error: e, event: t, status: n, message: a }) ?? { message: a };
}
function gn(e) {
  if (typeof e == 'function') oe.push(e);
  else {
    const { href: t } = new URL(e, location.href);
    oe.push((n) => n.href === t);
  }
}
function mn() {
  ((history.scrollRestoration = 'manual'),
    addEventListener('beforeunload', (t) => {
      let n = !1;
      if ((We(), !Q)) {
        const a = $e(m, void 0, null, 'leave'),
          r = {
            ...a.navigation,
            cancel: () => {
              ((n = !0), a.reject(new Error('navigation cancelled')));
            },
          };
        it.forEach((s) => s(r));
      }
      n ? (t.preventDefault(), (t.returnValue = '')) : (history.scrollRestoration = 'auto');
    }),
    addEventListener('visibilitychange', () => {
      document.visibilityState === 'hidden' && We();
    }),
    navigator.connection?.saveData || _n(),
    j.addEventListener('click', async (t) => {
      if (
        t.button ||
        t.which !== 1 ||
        t.metaKey ||
        t.ctrlKey ||
        t.shiftKey ||
        t.altKey ||
        t.defaultPrevented
      )
        return;
      const n = nt(t.composedPath()[0], j);
      if (!n) return;
      const { url: a, external: r, target: s, download: i } = be(n, L, k.hash);
      if (!a) return;
      if (s === '_parent' || s === '_top') {
        if (window.parent !== window) return;
      } else if (s && s !== '_self') return;
      const o = ne(n);
      if (
        (!(n instanceof SVGAElement) &&
          a.protocol !== location.protocol &&
          !(a.protocol === 'https:' || a.protocol === 'http:')) ||
        i
      )
        return;
      const [f, u] = (k.hash ? a.hash.replace(/^#/, '') : a.href).split('#'),
        h = f === me(location);
      if (r || (o.reload && (!h || !u))) {
        ht({ url: a, type: 'link', event: t }) ? (Q = !0) : t.preventDefault();
        return;
      }
      if (u !== void 0 && h) {
        const [, p] = m.url.href.split('#');
        if (p === u) {
          if (
            (t.preventDefault(),
            u === '' || (u === 'top' && n.ownerDocument.getElementById('top') === null))
          )
            scrollTo({ top: 0 });
          else {
            const l = n.ownerDocument.getElementById(decodeURIComponent(u));
            l && (l.scrollIntoView(), l.focus());
          }
          return;
        }
        if (((K = !0), Le(A), e(a), !o.replace_state)) return;
        K = !1;
      }
      (t.preventDefault(),
        await new Promise((p) => {
          (requestAnimationFrame(() => {
            setTimeout(p, 0);
          }),
            setTimeout(p, 100));
        }),
        await q({
          type: 'link',
          url: a,
          keepfocus: o.keepfocus,
          noscroll: o.noscroll,
          replace_state: o.replace_state ?? a.href === location.href,
          event: t,
        }));
    }),
    j.addEventListener('submit', (t) => {
      if (t.defaultPrevented) return;
      const n = HTMLFormElement.prototype.cloneNode.call(t.target),
        a = t.submitter;
      if ((a?.formTarget || n.target) === '_blank' || (a?.formMethod || n.method) !== 'get') return;
      const i = new URL((a?.hasAttribute('formaction') && a?.formAction) || n.action);
      if (he(i, L, !1)) return;
      const o = t.target,
        c = ne(o);
      if (c.reload) return;
      (t.preventDefault(), t.stopPropagation());
      const f = new FormData(o, a);
      ((i.search = new URLSearchParams(f).toString()),
        q({
          type: 'form',
          url: i,
          keepfocus: c.keepfocus,
          noscroll: c.noscroll,
          replace_state: c.replace_state ?? i.href === location.href,
          event: t,
        }));
    }),
    addEventListener('popstate', async (t) => {
      if (!Ae) {
        if (t.state?.[M]) {
          const n = t.state[M];
          if (((B = {}), n === A)) return;
          const a = F[n],
            r = t.state[Qe] ?? {},
            s = new URL(t.state[jt] ?? location.href),
            i = t.state[J],
            o = m.url ? me(location) === me(m.url) : !1;
          if (i === U && (ct || o)) {
            (r !== R.state && (R.state = r), e(s), (F[A] = de()), a && scrollTo(a.x, a.y), (A = n));
            return;
          }
          const f = n - A;
          await q({
            type: 'popstate',
            url: s,
            popped: { state: r, scroll: a, delta: f },
            accept: () => {
              ((A = n), (U = i));
            },
            block: () => {
              history.go(-f);
            },
            nav_token: B,
            event: t,
          });
        } else if (!K) {
          const n = new URL(location.href);
          (e(n), k.hash && location.reload());
        }
      }
    }),
    addEventListener('hashchange', () => {
      K &&
        ((K = !1), history.replaceState({ ...history.state, [M]: ++A, [J]: U }, '', location.href));
    }));
  for (const t of document.querySelectorAll('link')) an.has(t.rel) && (t.href = t.href);
  addEventListener('pageshow', (t) => {
    t.persisted && $.navigating.set((X.current = null));
  });
  function e(t) {
    ((m.url = R.url = t), $.page.set(De(R)), $.page.notify());
  }
}
async function yn(
  e,
  { status: t = 200, error: n, node_ids: a, params: r, route: s, server_route: i, data: o, form: c }
) {
  Pe = !0;
  const f = new URL(location.href);
  let u;
  (({ params: r = {}, route: s = { id: null } } = (await _e(f, !1)) || {}),
    (u = Ce.find(({ id: l }) => l === s.id)));
  let h,
    p = !0;
  try {
    const l = a.map(async (v, S) => {
        const _ = o[S];
        return (
          _?.uses && (_.uses = gt(_.uses)),
          Ne({
            loader: k.nodes[v],
            url: f,
            params: r,
            route: s,
            parent: async () => {
              const C = {};
              for (let g = 0; g < S; g += 1) Object.assign(C, (await l[g]).data);
              return C;
            },
            server_data_node: je(_),
          })
        );
      }),
      d = await Promise.all(l);
    if (u) {
      const v = u.layouts;
      for (let S = 0; S < v.length; S++) v[S] || d.splice(S, 0, void 0);
    }
    h = ce({ url: f, params: r, branch: d, status: t, error: n, form: c, route: u ?? null });
  } catch (l) {
    if (l instanceof Te) {
      await Y(new URL(l.location, location.href));
      return;
    }
    ((h = await pe({
      status: ae(l),
      error: await G(l, { url: f, params: r, route: s }),
      url: f,
      route: s,
    })),
      (e.textContent = ''),
      (p = !1));
  }
  (h.props.page && (h.props.page.state = {}), await ut(h, e, p));
}
async function _t(e, t) {
  const n = new URL(e);
  ((n.pathname = nn(e.pathname)),
    e.pathname.endsWith('/') && n.searchParams.append(Xt, '1'),
    n.searchParams.append(Jt, t.map((s) => (s ? '1' : '0')).join('')));
  const a = window.fetch,
    r = await a(n.href, {});
  if (!r.ok) {
    let s;
    throw (
      r.headers.get('content-type')?.includes('application/json')
        ? (s = await r.json())
        : r.status === 404
          ? (s = 'Not Found')
          : r.status === 500 && (s = 'Internal Error'),
      new fe(r.status, s)
    );
  }
  return new Promise(async (s) => {
    const i = new Map(),
      o = r.body.getReader();
    function c(u) {
      return Wt(u, {
        ...k.decoders,
        Promise: (h) =>
          new Promise((p, l) => {
            i.set(h, { fulfil: p, reject: l });
          }),
      });
    }
    let f = '';
    for (;;) {
      const { done: u, value: h } = await o.read();
      if (u && !f) break;
      for (
        f +=
          !h && f
            ? `
`
            : St.decode(h, { stream: !0 });
        ;

      ) {
        const p = f.indexOf(`
`);
        if (p === -1) break;
        const l = JSON.parse(f.slice(0, p));
        if (((f = f.slice(p + 1)), l.type === 'redirect')) return s(l);
        if (l.type === 'data')
          (l.nodes?.forEach((d) => {
            d?.type === 'data' && ((d.uses = gt(d.uses)), (d.data = c(d.data)));
          }),
            s(l));
        else if (l.type === 'chunk') {
          const { id: d, data: v, error: S } = l,
            _ = i.get(d);
          (i.delete(d), S ? _.reject(c(S)) : _.fulfil(c(v)));
        }
      }
    }
  });
}
function gt(e) {
  return {
    dependencies: new Set(e?.dependencies ?? []),
    params: new Set(e?.params ?? []),
    parent: !!e?.parent,
    route: !!e?.route,
    url: !!e?.url,
    search_params: new Set(e?.search_params ?? []),
  };
}
let Ae = !1;
function wn(e, t = null) {
  const n = document.querySelector('[autofocus]');
  if (n) n.focus();
  else {
    const a = mt(e);
    if (a && document.getElementById(a)) {
      const { x: s, y: i } = t ?? de();
      setTimeout(() => {
        const o = history.state;
        ((Ae = !0),
          location.replace(`#${a}`),
          k.hash && location.replace(e.hash),
          history.replaceState(o, '', e.hash),
          scrollTo(s, i),
          (Ae = !1));
      });
    } else {
      const s = document.body,
        i = s.getAttribute('tabindex');
      ((s.tabIndex = -1),
        s.focus({ preventScroll: !0, focusVisible: !1 }),
        i !== null ? s.setAttribute('tabindex', i) : s.removeAttribute('tabindex'));
    }
    const r = getSelection();
    if (r && r.type !== 'None') {
      const s = [];
      for (let i = 0; i < r.rangeCount; i += 1) s.push(r.getRangeAt(i));
      setTimeout(() => {
        if (r.rangeCount === s.length) {
          for (let i = 0; i < r.rangeCount; i += 1) {
            const o = s[i],
              c = r.getRangeAt(i);
            if (
              o.commonAncestorContainer !== c.commonAncestorContainer ||
              o.startContainer !== c.startContainer ||
              o.endContainer !== c.endContainer ||
              o.startOffset !== c.startOffset ||
              o.endOffset !== c.endOffset
            )
              return;
          }
          r.removeAllRanges();
        }
      });
    }
  }
}
function $e(e, t, n, a) {
  let r, s;
  const i = new Promise((c, f) => {
    ((r = c), (s = f));
  });
  return (
    i.catch(() => {}),
    {
      navigation: {
        from: { params: e.params, route: { id: e.route?.id ?? null }, url: e.url },
        to: n && { params: t?.params ?? null, route: { id: t?.route?.id ?? null }, url: n },
        willUnload: !t,
        type: a,
        complete: i,
      },
      fulfil: r,
      reject: s,
    }
  );
}
function De(e) {
  return {
    data: e.data,
    error: e.error,
    form: e.form,
    params: e.params,
    route: e.route,
    state: e.state,
    status: e.status,
    url: e.url,
  };
}
function vn(e) {
  const t = new URL(e);
  return ((t.hash = decodeURIComponent(e.hash)), t);
}
function mt(e) {
  let t;
  if (k.hash) {
    const [, , n] = e.hash.split('#', 3);
    t = n ?? '';
  } else t = e.hash.slice(1);
  return decodeURIComponent(t);
}
export { Tn as a, Sn as l, $ as s };
