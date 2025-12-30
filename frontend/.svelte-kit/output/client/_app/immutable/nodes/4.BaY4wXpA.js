import { f as w, a as p, c as he, t as Ca } from '../chunks/mgpANiac.js';
import { h as mn } from '../chunks/C0UKtQpt.js';
import { o as Ga, w as fn } from '../chunks/DY5-1jsb.js';
import {
  aV as hn,
  Z as Wr,
  o as Oa,
  q as Zr,
  a3 as jr,
  ag as gn,
  a8 as Nr,
  a as e,
  d as vt,
  a0 as _n,
  a1 as yn,
  a2 as Ur,
  a4 as Sr,
  aa as Dr,
  ah as bn,
  aP as xn,
  aB as Hr,
  I as wr,
  a9 as Pr,
  ac as Tn,
  aN as Or,
  aU as Kr,
  at as Br,
  w as ne,
  aW as Dn,
  aX as wn,
  aY as Cn,
  aZ as za,
  a5 as Xr,
  a7 as Qr,
  a_ as Ir,
  ai as kn,
  aM as En,
  a6 as jn,
  M as Nn,
  a$ as en,
  b0 as Sn,
  F as In,
  e as tn,
  J as Mn,
  b1 as $n,
  b2 as An,
  t as an,
  g as qn,
  x as ea,
  s as l,
  ad as fa,
  Y as Se,
  ae as sr,
  B as ta,
  C as a,
  y as r,
  b3 as Y,
  u as s,
  E as t,
  A as V,
  z as oe,
  b4 as rn,
  b5 as rr,
  b6 as Fa,
  n as Wt,
  $ as Pn,
} from '../chunks/6VQ_8qfV.js';
import { s as O, e as z } from '../chunks/BgKsp-fi.js';
import { i as S } from '../chunks/DWD46BZK.js';
import { t as Rn, s as Pt, c as Vr, B as Ua } from '../chunks/DBddglCw.js';
import { i as aa } from '../chunks/D4j-cL-r.js';
import { s as Ln, a as Fn } from '../chunks/DOiyoGAd.js';
import { a as On, b as zn } from '../chunks/CN9vruw_.js';
import { B as Un } from '../chunks/CTlAKUO8.js';
import { s as Mr } from '../chunks/BjBIcaOF.js';
import { _ as $r, b as yr } from '../chunks/y2GqnK4-.js';
import { p as Ae } from '../chunks/CEvUO948.js';
import { r as fe, s as Ye, a as Cr, b as Ar } from '../chunks/Djbzun47.js';
import { b as me, a as nn } from '../chunks/dsJstiAQ.js';
function Hn(i, o, c) {
  Oa && Zr();
  var f = new Un(i),
    C = !hn();
  Wr(() => {
    var g = o();
    (C && g !== null && typeof g == 'object' && (g = {}), f.ensure(g, c));
  });
}
function ha(i, o) {
  return o;
}
function Bn(i, o, c) {
  for (var f = [], C = o.length, g, u = o.length, v = 0; v < C; v++) {
    let ue = o[v];
    Qr(
      ue,
      () => {
        if (g) {
          if ((g.pending.delete(ue), g.done.add(ue), g.pending.size === 0)) {
            var te = i.outrogroups;
            (Rr(Or(g.done)), te.delete(g), te.size === 0 && (i.outrogroups = null));
          }
        } else u -= 1;
      },
      !1
    );
  }
  if (u === 0) {
    var h = f.length === 0 && c !== null;
    if (h) {
      var R = c,
        L = R.parentNode;
      (En(L), L.append(R), i.items.clear());
    }
    Rr(o, !h);
  } else ((g = { pending: new Set(o), done: new Set() }), (i.outrogroups ??= new Set()).add(g));
}
function Rr(i, o = !0) {
  for (var c = 0; c < i.length; c++) jn(i[c], o);
}
var Jr;
function bt(i, o, c, f, C, g = null) {
  var u = i,
    v = new Map(),
    h = (o & en) !== 0;
  if (h) {
    var R = i;
    u = Oa ? jr(gn(R)) : R.appendChild(Nr());
  }
  Oa && Zr();
  var L = null,
    ue = vt(() => {
      var A = c();
      return Kr(A) ? A : A == null ? [] : Or(A);
    }),
    te,
    ve = !0;
  function we() {
    ((n.fallback = L),
      Vn(n, te, u, o, f),
      L !== null &&
        (te.length === 0
          ? (L.f & za) === 0
            ? Xr(L)
            : ((L.f ^= za), pr(L, null, u))
          : Qr(L, () => {
              L = null;
            })));
  }
  var _e = Wr(() => {
      te = e(ue);
      var A = te.length;
      let le = !1;
      if (Oa) {
        var ye = _n(u) === yn;
        ye !== (A === 0) && ((u = Ur()), jr(u), Sr(!1), (le = !0));
      }
      for (var ge = new Set(), I = wr, se = Tn(), xe = 0; xe < A; xe += 1) {
        Oa && Dr.nodeType === bn && Dr.data === xn && ((u = Dr), (le = !0), Sr(!1));
        var J = te[xe],
          F = f(J, xe),
          j = ve ? null : v.get(F);
        (j
          ? (j.v && Hr(j.v, J), j.i && Hr(j.i, xe), se && I.skipped_effects.delete(j.e))
          : ((j = Jn(v, ve ? u : (Jr ??= Nr()), J, F, xe, C, o, c)),
            ve || (j.e.f |= za),
            v.set(F, j)),
          ge.add(F));
      }
      if (
        (A === 0 &&
          g &&
          !L &&
          (ve ? (L = Pr(() => g(u))) : ((L = Pr(() => g((Jr ??= Nr())))), (L.f |= za))),
        Oa && A > 0 && jr(Ur()),
        !ve)
      )
        if (se) {
          for (const [K, X] of v) ge.has(K) || I.skipped_effects.add(X.e);
          (I.oncommit(we), I.ondiscard(() => {}));
        } else we();
      (le && Sr(!0), e(ue));
    }),
    n = { effect: _e, items: v, outrogroups: null, fallback: L };
  ((ve = !1), Oa && (u = Dr));
}
function Vn(i, o, c, f, C) {
  var g = (f & Sn) !== 0,
    u = o.length,
    v = i.items,
    h = i.effect.first,
    R,
    L = null,
    ue,
    te = [],
    ve = [],
    we,
    _e,
    n,
    A;
  if (g)
    for (A = 0; A < u; A += 1)
      ((we = o[A]),
        (_e = C(we, A)),
        (n = v.get(_e).e),
        (n.f & za) === 0 && (n.nodes?.a?.measure(), (ue ??= new Set()).add(n)));
  for (A = 0; A < u; A += 1) {
    if (((we = o[A]), (_e = C(we, A)), (n = v.get(_e).e), i.outrogroups !== null))
      for (const j of i.outrogroups) (j.pending.delete(n), j.done.delete(n));
    if ((n.f & za) !== 0)
      if (((n.f ^= za), n === h)) pr(n, null, c);
      else {
        var le = L ? L.next : h;
        (n === i.effect.last && (i.effect.last = n.prev),
          n.prev && (n.prev.next = n.next),
          n.next && (n.next.prev = n.prev),
          Ja(i, L, n),
          Ja(i, n, le),
          pr(n, le, c),
          (L = n),
          (te = []),
          (ve = []),
          (h = L.next));
        continue;
      }
    if (
      ((n.f & Ir) !== 0 && (Xr(n), g && (n.nodes?.a?.unfix(), (ue ??= new Set()).delete(n))),
      n !== h)
    ) {
      if (R !== void 0 && R.has(n)) {
        if (te.length < ve.length) {
          var ye = ve[0],
            ge;
          L = ye.prev;
          var I = te[0],
            se = te[te.length - 1];
          for (ge = 0; ge < te.length; ge += 1) pr(te[ge], ye, c);
          for (ge = 0; ge < ve.length; ge += 1) R.delete(ve[ge]);
          (Ja(i, I.prev, se.next),
            Ja(i, L, I),
            Ja(i, se, ye),
            (h = ye),
            (L = se),
            (A -= 1),
            (te = []),
            (ve = []));
        } else
          (R.delete(n),
            pr(n, h, c),
            Ja(i, n.prev, n.next),
            Ja(i, n, L === null ? i.effect.first : L.next),
            Ja(i, L, n),
            (L = n));
        continue;
      }
      for (te = [], ve = []; h !== null && h !== n; )
        ((R ??= new Set()).add(h), ve.push(h), (h = h.next));
      if (h === null) continue;
    }
    ((n.f & za) === 0 && te.push(n), (L = n), (h = n.next));
  }
  if (i.outrogroups !== null) {
    for (const j of i.outrogroups)
      j.pending.size === 0 && (Rr(Or(j.done)), i.outrogroups?.delete(j));
    i.outrogroups.size === 0 && (i.outrogroups = null);
  }
  if (h !== null || R !== void 0) {
    var xe = [];
    if (R !== void 0) for (n of R) (n.f & Ir) === 0 && xe.push(n);
    for (; h !== null; ) ((h.f & Ir) === 0 && h !== i.fallback && xe.push(h), (h = h.next));
    var J = xe.length;
    if (J > 0) {
      var F = (f & en) !== 0 && u === 0 ? c : null;
      if (g) {
        for (A = 0; A < J; A += 1) xe[A].nodes?.a?.measure();
        for (A = 0; A < J; A += 1) xe[A].nodes?.a?.fix();
      }
      Bn(i, xe, F);
    }
  }
  g &&
    Nn(() => {
      if (ue !== void 0) for (n of ue) n.nodes?.a?.apply();
    });
}
function Jn(i, o, c, f, C, g, u, v) {
  var h = (u & wn) !== 0 ? ((u & Cn) === 0 ? ne(c, !1, !1) : Br(c)) : null,
    R = (u & Dn) !== 0 ? Br(C) : null;
  return {
    v: h,
    i: R,
    e: Pr(
      () => (
        g(o, h ?? c, R ?? C, v),
        () => {
          i.delete(f);
        }
      )
    ),
  };
}
function pr(i, o, c) {
  if (i.nodes)
    for (
      var f = i.nodes.start, C = i.nodes.end, g = o && (o.f & za) === 0 ? o.nodes.start : c;
      f !== null;

    ) {
      var u = kn(f);
      if ((g.before(f), f === C)) return;
      f = u;
    }
}
function Ja(i, o, c) {
  (o === null ? (i.effect.first = c) : (o.next = c),
    c === null ? (i.effect.last = o) : (c.prev = o));
}
function Lr(i, o, c, f) {
  var C = i.__style;
  if (Oa || C !== o) {
    var g = Rn(o);
    ((!Oa || g !== i.getAttribute('style')) &&
      (g == null ? i.removeAttribute('style') : (i.style.cssText = g)),
      (i.__style = o));
  }
  return f;
}
function sn(i, o, c = !1) {
  if (i.multiple) {
    if (o == null) return;
    if (!Kr(o)) return $n();
    for (var f of i.options) f.selected = o.includes(br(f));
    return;
  }
  for (f of i.options) {
    var C = br(f);
    if (An(C, o)) {
      f.selected = !0;
      return;
    }
  }
  (!c || o !== void 0) && (i.selectedIndex = -1);
}
function Gn(i) {
  var o = new MutationObserver(() => {
    sn(i, i.__value);
  });
  (o.observe(i, { childList: !0, subtree: !0, attributes: !0, attributeFilter: ['value'] }),
    an(() => {
      o.disconnect();
    }));
}
function nr(i, o, c = o) {
  var f = new WeakSet(),
    C = !0;
  (In(i, 'change', (g) => {
    var u = g ? '[selected]' : ':checked',
      v;
    if (i.multiple) v = [].map.call(i.querySelectorAll(u), br);
    else {
      var h = i.querySelector(u) ?? i.querySelector('option:not([disabled])');
      v = h && br(h);
    }
    (c(v), wr !== null && f.add(wr));
  }),
    tn(() => {
      var g = o();
      if (i === document.activeElement) {
        var u = Mn ?? wr;
        if (f.has(u)) return;
      }
      if ((sn(i, g, C), C && g === void 0)) {
        var v = i.querySelector(':checked');
        v !== null && ((g = br(v)), c(g));
      }
      ((i.__value = g), (C = !1));
    }),
    Gn(i));
}
function br(i) {
  return '__value' in i ? i.__value : i.value;
}
function mr(i, o, c) {
  var f = qn(i, o);
  f &&
    f.set &&
    ((i[o] = c),
    an(() => {
      i[o] = null;
    }));
}
function xr(i) {
  return function (...o) {
    var c = o[0];
    return (c.preventDefault(), i?.apply(this, o));
  };
}
var Yn = w('<div style="width: 100%; height: 100%; position: absolute;"></div>');
function Wn(i, o) {
  ea(o, !1);
  let c = Ae(o, 'tripData', 24, () => ({}));
  (Ae(o, 'fullTripData', 8, null), Ae(o, 'isPast', 8, !1));
  let f = Ae(o, 'highlightedTripId', 8, null),
    C = Ae(o, 'highlightedItemType', 8, null),
    g = Ae(o, 'highlightedItemId', 8, null),
    u = ne(),
    v = ne(),
    h = ne(!1),
    R = [],
    L = {};
  const ue =
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
  function te(J, F) {
    const K = ((F[0] - J[0]) * Math.PI) / 180,
      X = ((F[1] - J[1]) * Math.PI) / 180,
      y =
        Math.sin(K / 2) * Math.sin(K / 2) +
        Math.cos((J[0] * Math.PI) / 180) *
          Math.cos((F[0] * Math.PI) / 180) *
          Math.sin(X / 2) *
          Math.sin(X / 2);
    return 6371 * (2 * Math.atan2(Math.sqrt(y), Math.sqrt(1 - y)));
  }
  function ve(J, F, j = 300) {
    const K = [],
      X = (J[0] * Math.PI) / 180,
      y = (J[1] * Math.PI) / 180,
      Q = (F[0] * Math.PI) / 180,
      E = (F[1] * Math.PI) / 180,
      M = E - y,
      P = Math.sin(X) * Math.sin(Q) + Math.cos(X) * Math.cos(Q) * Math.cos(M),
      d = Math.acos(Math.max(-1, Math.min(1, P)));
    if (d < 1e-5) return (K.push(J, F), K);
    let b = J[1];
    for (let k = 0; k <= j; k++) {
      const W = k / j,
        re = Math.sin((1 - W) * d) / Math.sin(d),
        ie = Math.sin(W * d) / Math.sin(d),
        ce = re * Math.cos(X) * Math.cos(y) + ie * Math.cos(Q) * Math.cos(E),
        B = re * Math.cos(X) * Math.sin(y) + ie * Math.cos(Q) * Math.sin(E),
        Z = re * Math.sin(X) + ie * Math.sin(Q),
        G = Math.atan2(Z, Math.sqrt(ce * ce + B * B));
      let U = Math.atan2(B, ce),
        pe = (G * 180) / Math.PI,
        $e = (U * 180) / Math.PI;
      const Ve = $e - b;
      (Ve > 180 ? ($e -= 360) : Ve < -180 && ($e += 360), (b = $e), K.push([pe, $e]));
    }
    return K;
  }
  function we(J, F) {
    return new Promise((j) => {
      _e(J, F, j);
    });
  }
  async function _e(J, F, j) {
    if (!e(v) || !e(v)._container || !e(v)._container.offsetParent) return;
    const K = (
        await $r(
          async () => {
            const { default: ie } = await import('../chunks/2Sd0OU2W.js').then((ce) => ce.l);
            return { default: ie };
          },
          [],
          import.meta.url
        )
      ).default,
      X = R.find((ie) => ie.itemType === J && ie.itemId === F);
    if (!X) return;
    const y = `${J}-${F}`;
    if (L[y] && (clearInterval(L[y].interval), L[y].marker))
      try {
        e(v).removeLayer(L[y].marker);
      } catch {}
    const Q = X.polyline.getLatLngs();
    if (Q.length === 0) return;
    const E = Q[0],
      M = Q[Q.length - 1],
      P = te([E.lat, E.lng], [M.lat, M.lng]),
      d = e(v).getZoom(),
      b = Math.max(0.75, 2 ** (4 - d)),
      k = (P / 6e3) * 3e3 * b,
      W = 50,
      re = W / k;
    try {
      const ie = K.marker([E.lat, E.lng], {
        icon: K.divIcon({
          className: 'moving-dot-marker',
          html: `<div style="
            width: 12px;
            height: 12px;
            background: ${X.originalColor};
            border-radius: 50%;
            box-shadow: 0 0 10px ${X.originalColor}, 0 0 20px ${X.originalColor}, inset 0 0 5px rgba(255,255,255,0.5);
            border: 2px solid white;
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      }).addTo(e(v));
      let ce = 0;
      const B = setInterval(() => {
        if (((ce += re), ce >= 1)) {
          clearInterval(B);
          try {
            e(v).removeLayer(ie);
          } catch {}
          (delete L[y], j());
          return;
        }
        const Z = ce * (Q.length - 1),
          G = Math.floor(Z),
          U = Math.min(G + 1, Q.length - 1),
          pe = Z - G,
          $e = Q[G],
          Ve = Q[U],
          Et = $e.lat + (Ve.lat - $e.lat) * pe,
          Xe = $e.lng + (Ve.lng - $e.lng) * pe;
        ie.setLatLng(K.latLng(Et, Xe));
      }, W);
      L[y] = { marker: ie, interval: B };
    } catch (ie) {
      console.error('[MapVisualization] Error creating animation:', ie);
    }
  }
  async function n(J) {
    if (!(!e(v) || !e(v)._container || !e(v)._container.offsetParent) && L[J]) {
      if ((clearInterval(L[J].interval), L[J].marker))
        try {
          e(v).removeLayer(L[J].marker);
        } catch {}
      delete L[J];
    }
  }
  function A() {
    Object.keys(L).forEach((J) => {
      n(J);
    });
  }
  async function le(J) {
    if (!e(v) || !R || R.length === 0) return;
    A();
    const F = R.filter((j) => j.tripId === J);
    if (F.length !== 0) {
      F.sort((j, K) => {
        const X = j.sortDate?.getTime() || 0,
          y = K.sortDate?.getTime() || 0;
        return X - y;
      });
      for (const j of F)
        await new Promise((K) => {
          _e(j.itemType, j.itemId, K);
        });
    }
  }
  function ye() {
    return e(v);
  }
  async function ge() {
    if (!e(v) || !c()) return;
    const J = (
      await $r(
        async () => {
          const { default: y } = await import('../chunks/2Sd0OU2W.js').then((Q) => Q.l);
          return { default: y };
        },
        [],
        import.meta.url
      )
    ).default;
    ((R = []),
      Object.keys(L).forEach((y) => {
        if ((L[y].interval && clearInterval(L[y].interval), L[y].marker))
          try {
            e(v).removeLayer(L[y].marker);
          } catch {}
      }),
      (L = {}),
      e(v).eachLayer((y) => {
        (y instanceof J.Marker || y instanceof J.Polyline) && e(v).removeLayer(y);
      }));
    const F = [],
      j = [],
      K = [];
    if (c().flights && Array.isArray(c().flights))
      for (const y of c().flights) {
        if (!y.origin || !y.destination) continue;
        const Q = parseFloat(y.originLat),
          E = parseFloat(y.originLng),
          M = parseFloat(y.destinationLat),
          P = parseFloat(y.destinationLng);
        (!isNaN(Q) &&
          !isNaN(E) &&
          (F.push({
            name: y.origin,
            type: 'flight',
            details: `${y.airline} ${y.flightNumber}`,
            lat: Q,
            lng: E,
          }),
          K.push([Q, E])),
          !isNaN(M) &&
            !isNaN(P) &&
            (F.push({
              name: y.destination,
              type: 'flight',
              details: `${y.airline} ${y.flightNumber}`,
              lat: M,
              lng: P,
            }),
            K.push([M, P])),
          !isNaN(Q) &&
            !isNaN(E) &&
            !isNaN(M) &&
            !isNaN(P) &&
            j.push({
              type: 'flight',
              from: [Q, E],
              to: [M, P],
              color: '#a68900',
              itemType: 'flight',
              itemId: y.id,
              tripId: y.tripId || null,
              sortDate: new Date(y.departureDateTime || 0),
            }));
      }
    if (c().hotels && Array.isArray(c().hotels))
      for (const y of c().hotels) {
        if (!y.address) continue;
        const Q = parseFloat(y.lat),
          E = parseFloat(y.lng);
        !isNaN(Q) &&
          !isNaN(E) &&
          (F.push({ name: y.hotelName, type: 'hotel', details: y.address, lat: Q, lng: E }),
          K.push([Q, E]));
      }
    if (c().events && Array.isArray(c().events))
      for (const y of c().events) {
        if (!y.location) continue;
        const Q = parseFloat(y.lat),
          E = parseFloat(y.lng);
        !isNaN(Q) &&
          !isNaN(E) &&
          (F.push({ name: y.name, type: 'event', details: y.location, lat: Q, lng: E }),
          K.push([Q, E]));
      }
    if (c().transportation && Array.isArray(c().transportation))
      for (const y of c().transportation) {
        if (!y.origin || !y.destination) continue;
        const Q = parseFloat(y.originLat),
          E = parseFloat(y.originLng),
          M = parseFloat(y.destinationLat),
          P = parseFloat(y.destinationLng);
        (!isNaN(Q) &&
          !isNaN(E) &&
          (F.push({ name: y.method, type: 'transportation', details: y.origin, lat: Q, lng: E }),
          K.push([Q, E])),
          !isNaN(M) &&
            !isNaN(P) &&
            (F.push({
              name: y.method,
              type: 'transportation',
              details: y.destination,
              lat: M,
              lng: P,
            }),
            K.push([M, P])),
          !isNaN(Q) &&
            !isNaN(E) &&
            !isNaN(M) &&
            !isNaN(P) &&
            j.push({
              type: 'transportation',
              from: [Q, E],
              to: [M, P],
              color: '#0066cc',
              itemType: 'transportation',
              itemId: y.id,
              tripId: y.tripId || null,
              sortDate: new Date(y.departureDateTime || 0),
            }));
      }
    if (c().carRentals && Array.isArray(c().carRentals))
      for (const y of c().carRentals) {
        if (!y.pickupLocation) continue;
        const Q = parseFloat(y.pickupLat),
          E = parseFloat(y.pickupLng);
        !isNaN(Q) &&
          !isNaN(E) &&
          (F.push({
            name: y.company,
            type: 'carRental',
            details: y.pickupLocation,
            lat: Q,
            lng: E,
          }),
          K.push([Q, E]));
      }
    const X = {
      flight: '#a68900',
      event: '#d6006a',
      hotel: '#7c2d8f',
      carRental: '#d35a2f',
      transportation: '#0066cc',
    };
    if (
      (j.forEach((y, Q) => {
        const E = ve(y.from, y.to),
          M = J.polyline(E, {
            color: y.color,
            weight: 6,
            opacity: 0.2,
            smooth: !0,
            noClip: !0,
          }).addTo(e(v)),
          P = J.polyline(E, {
            color: y.color,
            weight: 4,
            opacity: 0.35,
            smooth: !0,
            noClip: !0,
          }).addTo(e(v)),
          d = J.polyline(E, {
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            smooth: !0,
            noClip: !0,
          }).addTo(e(v));
        R.push({
          index: Q + 1,
          polyline: d,
          glowLayers: [M, P, d],
          originalColor: y.color,
          originalWeight: 2,
          originalOpacity: 1,
          itemType: y.itemType,
          itemId: y.itemId,
          tripId: y.tripId,
          sortDate: y.sortDate,
        });
      }),
      F.forEach((y) => {
        const Q = X[y.type] || '#6c757d',
          E = J.circleMarker([y.lat, y.lng], {
            radius: 4,
            fillColor: Q,
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
          }).addTo(e(v)),
          M = `
        <div style="min-width: 200px;">
          <strong>${y.name}</strong><br>
          <em>${y.type}</em><br>
          ${y.details}
        </div>
      `;
        E.bindPopup(M);
      }),
      K.length > 0)
    ) {
      const y = J.latLngBounds(K),
        Q = y.getNorth() - y.getSouth(),
        E = y.getEast() - y.getWest(),
        M = Math.max(Q, E);
      let P;
      (M > 300
        ? (P = 1.5)
        : M > 150
          ? (P = 1.75)
          : M > 100
            ? (P = 2)
            : M > 50
              ? (P = 2.5)
              : M > 20
                ? (P = 3)
                : M > 10
                  ? (P = 3.5)
                  : (P = 4),
        e(v).fitBounds(y, { maxZoom: P, animate: !1 }));
      const d = e(v).getBounds(),
        b = d.getCenter(),
        k = d.getEast() - d.getWest();
      d.getNorth() - d.getSouth();
      const W = J.latLng(b.lat, b.lng - k * 0.135);
      e(v).setView(W, e(v).getZoom(), { animate: !1 });
    }
  }
  function I(J) {
    return J
      ? J.flights?.length > 0 ||
          J.hotels?.length > 0 ||
          J.events?.length > 0 ||
          J.transportation?.length > 0 ||
          J.carRentals?.length > 0
      : !1;
  }
  (Ga(async () => {
    if (!e(u))
      return (
        console.error('[MapVisualization DEBUG] mapContainer is null!'),
        () => {
          e(v) && e(v).remove();
        }
      );
    try {
      const J = (
        await $r(
          async () => {
            const { default: j } = await import('../chunks/2Sd0OU2W.js').then((K) => K.l);
            return { default: j };
          },
          [],
          import.meta.url
        )
      ).default;
      (l(
        v,
        J.map(e(u), {
          center: [0, 0],
          zoom: 2,
          minZoom: 1,
          zoomSnap: 0.5,
          zoomControl: !1,
          scrollWheelZoom: !0,
          attributionControl: !1,
          worldCopyJump: !0,
        })
      ),
        J.control.zoom({ position: 'bottomright' }).addTo(e(v)));
      const F = window.MAP_TILE_URL || ue;
      J.tileLayer(F, { attribution: '', maxZoom: 18, minZoom: 1 }).addTo(e(v));
    } catch (J) {
      console.error('[MapVisualization DEBUG] Error initializing empty map:', J);
    }
    return (
      l(h, !0),
      () => {
        e(v) && e(v).remove();
      }
    );
  }),
    fa(
      () => (e(h), e(v), Se(c())),
      () => {
        e(h) &&
          e(v) &&
          c() &&
          I(c()) &&
          ge().catch((J) =>
            console.error('[MapVisualization DEBUG] populateMapWithData error:', J)
          );
      }
    ),
    fa(
      () => (e(h), e(v), Se(f()), Se(g())),
      () => {
        e(h) && e(v) && f() && !g()
          ? le(f()).catch((J) =>
              console.error('[MapVisualization DEBUG] highlightTripOnMap error:', J)
            )
          : !f() && !g() && e(h) && e(v) && A();
      }
    ),
    fa(
      () => (e(h), e(v), Se(g()), Se(C())),
      () => {
        e(h) &&
          e(v) &&
          g() &&
          C() &&
          (A(),
          we(C(), g()).catch((J) =>
            console.error('[MapVisualization DEBUG] highlightMapMarker error:', J)
          ));
      }
    ),
    sr());
  var se = {
    highlightMapMarker: we,
    unhighlightMapMarker: n,
    clearAllAnimations: A,
    getMapInstance: ye,
  };
  aa();
  var xe = Yn();
  return (
    yr(
      xe,
      (J) => l(u, J),
      () => e(u)
    ),
    p(i, xe),
    mr(o, 'highlightMapMarker', we),
    mr(o, 'unhighlightMapMarker', n),
    mr(o, 'clearAllAnimations', A),
    mr(o, 'getMapInstance', ye),
    ta(se)
  );
}
var Zn = w(
  '<div class="map-layout svelte-4r5mac"><div id="tripMap" class="map-container svelte-4r5mac"><!></div> <aside class="primary-sidebar sidebar svelte-4r5mac"><!></aside> <aside id="secondary-sidebar" class="secondary-sidebar sidebar svelte-4r5mac"><!></aside> <aside id="tertiary-sidebar" class="tertiary-sidebar sidebar svelte-4r5mac"><!></aside></div>'
);
function Kn(i, o) {
  ea(o, !1);
  let c = Ae(o, 'tripData', 8, null),
    f = Ae(o, 'isPast', 8, !1),
    C = Ae(o, 'highlightedTripId', 8, null),
    g = Ae(o, 'highlightedItemType', 8, null),
    u = Ae(o, 'highlightedItemId', 8, null),
    v = ne(),
    h = ne(),
    R = ne();
  function L() {
    return e(R);
  }
  Ga(() => {
    const I = new MutationObserver(() => {
      if (e(v)) {
        const se = e(v).textContent?.trim().length > 0;
        Y(v, (e(v).style.display = se ? 'flex' : 'none'));
      }
      if (e(h)) {
        const se = e(h).textContent?.trim().length > 0;
        Y(h, (e(h).style.display = se ? 'flex' : 'none'));
      }
    });
    if (e(v)) {
      I.observe(e(v), { childList: !0, subtree: !0, characterData: !0 });
      const se = e(v).textContent?.trim().length > 0;
      Y(v, (e(v).style.display = se ? 'flex' : 'none'));
    }
    if (e(h)) {
      I.observe(e(h), { childList: !0, subtree: !0, characterData: !0 });
      const se = e(h).textContent?.trim().length > 0;
      Y(h, (e(h).style.display = se ? 'flex' : 'none'));
    }
    return () => I.disconnect();
  });
  var ue = { getMapComponent: L };
  aa();
  var te = Zn(),
    ve = a(te),
    we = a(ve);
  (Hn(
    we,
    () => (Se(c()), s(() => JSON.stringify(c()))),
    (I) => {
      yr(
        Wn(I, {
          get tripData() {
            return c();
          },
          get isPast() {
            return f();
          },
          get highlightedTripId() {
            return C();
          },
          get highlightedItemType() {
            return g();
          },
          get highlightedItemId() {
            return u();
          },
          $$legacy: !0,
        }),
        (se) => l(R, se),
        () => e(R)
      );
    }
  ),
    t(ve));
  var _e = r(ve, 2),
    n = a(_e);
  (Mr(n, o, 'primary', {}), t(_e));
  var A = r(_e, 2),
    le = a(A);
  (Mr(le, o, 'secondary', {}),
    t(A),
    yr(
      A,
      (I) => l(v, I),
      () => e(v)
    ));
  var ye = r(A, 2),
    ge = a(ye);
  return (
    Mr(ge, o, 'tertiary', {}),
    t(ye),
    yr(
      ye,
      (I) => l(h, I),
      () => e(h)
    ),
    t(te),
    p(i, te),
    mr(o, 'getMapComponent', L),
    ta(ue)
  );
}
const on = {
    currentTrip: null,
    trips: [],
    flights: [],
    hotels: [],
    events: [],
    carRentals: [],
    transportation: [],
    companions: [],
    vouchers: [],
    loading: !1,
    error: null,
  },
  da = fn(on),
  Xn = {
    setCurrentTrip(i) {
      da.update((o) => ({ ...o, currentTrip: i }));
    },
    setTrips(i) {
      da.update((o) => ({ ...o, trips: i }));
    },
    addTrip(i) {
      da.update((o) => ({ ...o, trips: [...o.trips, i] }));
    },
    updateTrip(i, o) {
      da.update((c) => ({
        ...c,
        trips: c.trips.map((f) => (f.id === i ? { ...f, ...o } : f)),
        currentTrip: c.currentTrip?.id === i ? { ...c.currentTrip, ...o } : c.currentTrip,
      }));
    },
    deleteTrip(i) {
      da.update((o) => ({
        ...o,
        trips: o.trips.filter((c) => c.id !== i),
        currentTrip: o.currentTrip?.id === i ? null : o.currentTrip,
      }));
    },
    setFlights(i) {
      da.update((o) => ({ ...o, flights: i }));
    },
    addFlight(i) {
      da.update((o) => ({ ...o, flights: [...o.flights, i] }));
    },
    updateFlight(i, o) {
      da.update((c) => ({
        ...c,
        flights: c.flights.map((f) => (f.id === i ? { ...f, ...o } : f)),
      }));
    },
    deleteFlight(i) {
      da.update((o) => ({ ...o, flights: o.flights.filter((c) => c.id !== i) }));
    },
    setHotels(i) {
      da.update((o) => ({ ...o, hotels: i }));
    },
    addHotel(i) {
      da.update((o) => ({ ...o, hotels: [...o.hotels, i] }));
    },
    updateHotel(i, o) {
      da.update((c) => ({ ...c, hotels: c.hotels.map((f) => (f.id === i ? { ...f, ...o } : f)) }));
    },
    deleteHotel(i) {
      da.update((o) => ({ ...o, hotels: o.hotels.filter((c) => c.id !== i) }));
    },
    setLoading(i) {
      da.update((o) => ({ ...o, loading: i }));
    },
    setError(i) {
      da.update((o) => ({ ...o, error: i }));
    },
    reset() {
      da.set(on);
    },
  };
function Qn() {
  if (typeof window < 'u') {
    const i = window.location.hostname,
      o = window.location.protocol;
    return window.location.port === '5173'
      ? `${o}//${i}:3501/api`
      : i === 'localhost' || i === '127.0.0.1'
        ? `${o}//localhost:3000/api`
        : `${o}//${i}:3501/api`;
  }
  return 'http://localhost:3000/api';
}
const ei = Qn();
function ti(i) {
  return i && typeof i == 'object' && 'data' in i ? i.data : i;
}
async function Ze(i, o) {
  const c = `${ei}${i}`;
  try {
    const f = await fetch(c, {
      ...o,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...o?.headers },
    });
    if (!f.ok) {
      let u = `API error (${f.status})`;
      try {
        const v = await f.json();
        u = v.message || v.error || u;
      } catch {
        try {
          const v = await f.text();
          v && (u = v);
        } catch {}
      }
      throw f.status === 401
        ? (typeof window < 'u' && (window.location.href = '/login'),
          new Error('Your session has expired. Please log in again.'))
        : f.status === 403
          ? new Error('You do not have permission to access this resource.')
          : f.status === 404
            ? new Error('The requested resource was not found.')
            : f.status === 409
              ? new Error(
                  u !== 'API error (409)' ? u : 'This item already exists or there was a conflict.'
                )
              : f.status >= 500
                ? new Error('Server error. Please try again later.')
                : new Error(u);
    }
    if (f.status === 204) return null;
    const C = await f.json();
    return ti(C);
  } catch (f) {
    throw f instanceof TypeError && f.message.includes('fetch')
      ? new Error('Network error. Please check your internet connection and try again.')
      : f instanceof Error
        ? f
        : new Error('An unexpected error occurred. Please try again.');
  }
}
const ir = {
    getAll: (i = 'upcoming') => Ze(`/v1/trips?filter=${i}`),
    getOne: (i) => Ze(`/v1/trips/${i}`),
    create: (i) => Ze('/v1/trips', { method: 'POST', body: JSON.stringify(i) }),
    update: (i, o) => Ze(`/v1/trips/${i}`, { method: 'PUT', body: JSON.stringify(o) }),
    delete: (i) => Ze(`/v1/trips/${i}`, { method: 'DELETE' }),
  },
  ar = {
    getById: (i) => Ze(`/v1/flights/${i}`),
    getByTrip: (i) => Ze(`/v1/flights/trips/${i}`),
    createStandalone: (i) => Ze('/v1/flights', { method: 'POST', body: JSON.stringify(i) }),
    create: (i, o) =>
      i
        ? Ze(`/v1/flights/trips/${i}`, { method: 'POST', body: JSON.stringify(o) })
        : ar.createStandalone(o),
    update: (i, o) => Ze(`/v1/flights/${i}`, { method: 'PUT', body: JSON.stringify(o) }),
    delete: (i) => Ze(`/v1/flights/${i}`, { method: 'DELETE' }),
    lookupAirline: (i) => Ze(`/v1/flights/lookup/airline/${encodeURIComponent(i.toUpperCase())}`),
  },
  fr = {
    getById: (i) => Ze(`/v1/hotels/${i}`),
    getByTrip: (i) => Ze(`/v1/hotels/trips/${i}`),
    createStandalone: (i) => Ze('/v1/hotels', { method: 'POST', body: JSON.stringify(i) }),
    create: (i, o) =>
      i
        ? Ze(`/v1/hotels/trips/${i}`, { method: 'POST', body: JSON.stringify(o) })
        : fr.createStandalone(o),
    update: (i, o) => Ze(`/v1/hotels/${i}`, { method: 'PUT', body: JSON.stringify(o) }),
    delete: (i) => Ze(`/v1/hotels/${i}`, { method: 'DELETE' }),
  },
  hr = {
    getById: (i) => Ze(`/v1/events/${i}`),
    getByTrip: (i) => Ze(`/v1/events/trips/${i}`),
    createStandalone: (i) => Ze('/v1/events', { method: 'POST', body: JSON.stringify(i) }),
    create: (i, o) =>
      i
        ? Ze(`/v1/events/trips/${i}`, { method: 'POST', body: JSON.stringify(o) })
        : hr.createStandalone(o),
    update: (i, o) => Ze(`/v1/events/${i}`, { method: 'PUT', body: JSON.stringify(o) }),
    delete: (i) => Ze(`/v1/events/${i}`, { method: 'DELETE' }),
  },
  gr = {
    getById: (i) => Ze(`/v1/transportation/${i}`),
    getByTrip: (i) => Ze(`/v1/transportation/trips/${i}`),
    createStandalone: (i) => Ze('/v1/transportation', { method: 'POST', body: JSON.stringify(i) }),
    create: (i, o) =>
      i
        ? Ze(`/v1/transportation/trips/${i}`, { method: 'POST', body: JSON.stringify(o) })
        : gr.createStandalone(o),
    update: (i, o) => Ze(`/v1/transportation/${i}`, { method: 'PUT', body: JSON.stringify(o) }),
    delete: (i) => Ze(`/v1/transportation/${i}`, { method: 'DELETE' }),
  },
  _r = {
    getById: (i) => Ze(`/v1/car-rentals/${i}`),
    getByTrip: (i) => Ze(`/v1/car-rentals/trips/${i}`),
    createStandalone: (i) => Ze('/v1/car-rentals', { method: 'POST', body: JSON.stringify(i) }),
    create: (i, o) =>
      i
        ? Ze(`/v1/car-rentals/trips/${i}`, { method: 'POST', body: JSON.stringify(o) })
        : _r.createStandalone(o),
    update: (i, o) => Ze(`/v1/car-rentals/${i}`, { method: 'PUT', body: JSON.stringify(o) }),
    delete: (i) => Ze(`/v1/car-rentals/${i}`, { method: 'DELETE' }),
  },
  kr = {
    getAll: () => Ze('/v1/companions/all'),
    getByTrip: (i) => Ze(`/v1/companions/trips/${i}`),
    addToTrip: (i, o, c) =>
      Ze(`/v1/companions/trips/${i}`, {
        method: 'POST',
        body: JSON.stringify({ companionId: o, canEdit: c }),
      }),
    removeFromTrip: (i, o) => Ze(`/v1/companions/trips/${i}/${o}`, { method: 'DELETE' }),
  },
  qr = {
    update: (i, o, c) =>
      Ze(`/v1/item-companions/${i}/${o}`, {
        method: 'PUT',
        body: JSON.stringify({ companionIds: c }),
      }),
  };
function Ma(i, o) {
  if (!i) return '';
  try {
    const c = new Date(i);
    if (isNaN(c.getTime())) return '';
    if (!o) {
      const u = c.getUTCFullYear(),
        v = String(c.getUTCMonth() + 1).padStart(2, '0'),
        h = String(c.getUTCDate()).padStart(2, '0'),
        R = String(c.getUTCHours()).padStart(2, '0'),
        L = String(c.getUTCMinutes()).padStart(2, '0');
      return `${u}-${v}-${h}T${R}:${L}`;
    }
    const C = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: !1,
        timeZone: o,
      }).formatToParts(c),
      g = {};
    return (
      C.forEach((u) => {
        u.type !== 'literal' && (g[u.type] = u.value);
      }),
      `${g.year}-${g.month}-${g.day}T${g.hour}:${g.minute}`
    );
  } catch (c) {
    return (console.error('Error converting UTC to local time:', c), '');
  }
}
var ai = w('<p class="loading-message svelte-1a5pdw0"> </p>'),
  ri = w('<div><div class="spinner svelte-1a5pdw0"></div> <!></div>');
function ni(i, o) {
  let c = Ae(o, 'size', 8, 'medium'),
    f = Ae(o, 'message', 8, 'Loading...');
  var C = ri(),
    g = r(a(C), 2);
  {
    var u = (v) => {
      var h = ai(),
        R = a(h, !0);
      (t(h), V(() => O(R, f())), p(v, h));
    };
    S(g, (v) => {
      f() && v(u);
    });
  }
  (t(C), V(() => Pt(C, 1, `loading-container loading-${c() ?? ''}`, 'svelte-1a5pdw0')), p(i, C));
}
var ii = w('<strong class="svelte-1frq9vu"> </strong>'),
  si = w('<button class="alert-close svelte-1frq9vu"><span aria-label="Close">×</span></button>'),
  oi = w(
    '<div><div class="alert-content svelte-1frq9vu"><!> <p class="svelte-1frq9vu"> </p></div> <!></div>'
  );
function Ha(i, o) {
  let c = Ae(o, 'type', 8, 'info'),
    f = Ae(o, 'title', 8, ''),
    C = Ae(o, 'message', 8),
    g = Ae(o, 'dismissible', 8, !1),
    u = ne(!0);
  function v() {
    l(u, !1);
  }
  var h = he(),
    R = oe(h);
  {
    var L = (ue) => {
      var te = oi(),
        ve = a(te),
        we = a(ve);
      {
        var _e = (ge) => {
          var I = ii(),
            se = a(I, !0);
          (t(I), V(() => O(se, f())), p(ge, I));
        };
        S(we, (ge) => {
          f() && ge(_e);
        });
      }
      var n = r(we, 2),
        A = a(n, !0);
      (t(n), t(ve));
      var le = r(ve, 2);
      {
        var ye = (ge) => {
          var I = si();
          (z('click', I, v), p(ge, I));
        };
        S(le, (ge) => {
          g() && ge(ye);
        });
      }
      (t(te),
        V(() => {
          (Pt(te, 1, `alert alert-${c() ?? ''}`, 'svelte-1frq9vu'), O(A, C()));
        }),
        p(ue, te));
    };
    S(R, (ue) => {
      e(u) && ue(L);
    });
  }
  p(i, h);
}
var li = w(
    '<div class="loading-indicator svelte-zauskz"><span class="spinner svelte-zauskz"></span> Searching...</div>'
  ),
  di = w(
    '<div role="option"><div class="airport-code svelte-zauskz"> </div> <div class="airport-info svelte-zauskz"><div class="airport-name svelte-zauskz"> </div> <div class="airport-location svelte-zauskz"> </div></div></div>'
  ),
  ci = w('<div class="autocomplete-results svelte-zauskz"></div>'),
  vi = w(
    '<div class="autocomplete-container svelte-zauskz"><input type="text" style="text-transform: uppercase;" class="svelte-zauskz"/> <!> <!></div>'
  );
function Gr(i, o) {
  ea(o, !1);
  let c = Ae(o, 'value', 12, ''),
    f = Ae(o, 'placeholder', 8, ''),
    C = Ae(o, 'onSelect', 8, (I) => {}),
    g = ne([]),
    u = ne(!1),
    v = ne(!1),
    h = ne(),
    R = ne(-1);
  const L = (() => {
    let I;
    return (se) => {
      if ((clearTimeout(I), se.length < 2)) {
        (l(g, []), l(u, !1));
        return;
      }
      (l(v, !0),
        (I = setTimeout(async () => {
          try {
            const xe = await Ze(`/v1/airports/search?q=${encodeURIComponent(se)}&limit=10`);
            (l(g, xe.airports || []), l(u, e(g).length > 0));
          } catch (xe) {
            (console.error('Airport search error:', xe), l(g, []), l(u, !1));
          } finally {
            l(v, !1);
          }
        }, 300)));
    };
  })();
  function ue(I) {
    (c(I.target.value.toUpperCase()), l(R, -1), L(c()));
  }
  function te(I) {
    (c(I.iata), l(g, []), l(u, !1), l(R, -1), C()(I));
  }
  function ve(I) {
    if (e(u))
      switch (I.key) {
        case 'ArrowDown':
          (I.preventDefault(), l(R, Math.min(e(R) + 1, e(g).length - 1)));
          break;
        case 'ArrowUp':
          (I.preventDefault(), l(R, Math.max(e(R) - 1, -1)));
          break;
        case 'Enter':
          (I.preventDefault(), e(R) >= 0 && te(e(g)[e(R)]));
          break;
        case 'Escape':
          (I.preventDefault(), l(u, !1), l(R, -1));
          break;
      }
  }
  function we() {
    setTimeout(() => {
      (l(u, !1), l(R, -1));
    }, 200);
  }
  (Ga(() => {
    function I(se) {
      e(h) && !e(h).contains(se.target) && l(u, !1);
    }
    return (document.addEventListener('click', I), () => document.removeEventListener('click', I));
  }),
    aa());
  var _e = vi(),
    n = a(_e);
  (fe(n),
    yr(
      n,
      (I) => l(h, I),
      () => e(h)
    ));
  var A = r(n, 2);
  {
    var le = (I) => {
      var se = li();
      p(I, se);
    };
    S(A, (I) => {
      e(v) && I(le);
    });
  }
  var ye = r(A, 2);
  {
    var ge = (I) => {
      var se = ci();
      (bt(
        se,
        7,
        () => e(g),
        (xe) => xe.iata,
        (xe, J, F) => {
          var j = di();
          let K;
          var X = a(j),
            y = a(X, !0);
          t(X);
          var Q = r(X, 2),
            E = a(Q),
            M = a(E, !0);
          t(E);
          var P = r(E, 2),
            d = a(P);
          (t(P),
            t(Q),
            t(j),
            V(() => {
              ((K = Pt(j, 1, 'result-item svelte-zauskz', null, K, { selected: e(R) === e(F) })),
                Ye(j, 'aria-selected', e(R) === e(F)),
                O(y, (e(J), s(() => e(J).iata))),
                O(M, (e(J), s(() => e(J).name))),
                O(
                  d,
                  `${(e(J), s(() => e(J).city) ?? '')}, ${(e(J), s(() => e(J).country) ?? '')}`
                ));
            }),
            z('click', j, () => te(e(J))),
            z('keydown', j, (b) => b.key === 'Enter' && te(e(J))),
            p(xe, j));
        }
      ),
        t(se),
        p(I, se));
    };
    S(ye, (I) => {
      (e(u), e(g), s(() => e(u) && e(g).length > 0) && I(ge));
    });
  }
  (t(_e),
    V(() => Ye(n, 'placeholder', f())),
    me(n, c),
    z('input', n, ue),
    z('keydown', n, ve),
    z('focus', n, () => c().length >= 2 && e(g).length > 0 && l(u, !0)),
    z('blur', n, we),
    p(i, _e),
    ta());
}
var ui = w('<button class="clear-btn svelte-1s09zii">✕</button>'),
  pi = w(
    '<button class="result-item svelte-1s09zii"><span class="result-name svelte-1s09zii"> </span> <span class="result-email svelte-1s09zii"> </span></button>'
  ),
  mi = w('<div class="search-results svelte-1s09zii"></div>'),
  fi = w(
    '<div class="search-results empty svelte-1s09zii"><p class="svelte-1s09zii">No companions found</p></div>'
  ),
  hi = w(
    '<div class="companion-item svelte-1s09zii"><div class="companion-info svelte-1s09zii"><span class="companion-name svelte-1s09zii"> </span></div> <button class="remove-btn svelte-1s09zii" title="Remove companion">✕</button></div>'
  ),
  gi = w(
    '<div class="companions-list svelte-1s09zii"><div class="list-header svelte-1s09zii"><span>Name</span> <span class="action-col svelte-1s09zii"></span></div> <!></div>'
  ),
  _i = w('<p class="no-companions svelte-1s09zii">No companions added yet</p>'),
  yi = w(
    '<div class="companions-form svelte-1s09zii"><h4 class="section-title svelte-1s09zii">Travel Companions</h4> <!> <div class="search-container svelte-1s09zii"><div class="search-box svelte-1s09zii"><input type="text" placeholder="Search companions by name or email..." class="search-input svelte-1s09zii"/> <!></div> <!></div> <!></div>'
  );
function bi(i, o) {
  ea(o, !1);
  let c = Ae(o, 'companions', 28, () => []),
    f = Ae(o, 'onCompanionsUpdate', 8, null),
    C = Ae(o, 'onAddCompanion', 8, null),
    g = Ae(o, 'onRemoveCompanion', 8, null),
    u = ne(''),
    v = ne(!1),
    h = ne(null),
    R = ne([]),
    L = ne(!1),
    ue = [],
    te = !0;
  async function ve() {
    try {
      te = !0;
      const d = await kr.getAll();
      ue = Array.isArray(d) ? d : d?.data || [];
    } catch (d) {
      (console.error('Failed to load companions:', d), (ue = []));
    } finally {
      te = !1;
    }
  }
  Ga(() => {
    ve();
  });
  function we(d) {
    const b = d.companion || d;
    return b.firstName && b.lastName
      ? `${b.firstName} ${b.lastName}`
      : b.firstName
        ? b.firstName
        : b.lastName
          ? b.lastName
          : b.email;
  }
  function _e(d) {
    return d.companion?.email || d.email;
  }
  function n() {
    if (!e(u).trim()) {
      (l(R, []), l(L, !1));
      return;
    }
    const d = e(u).toLowerCase(),
      b = new Set(c().map((k) => _e(k)));
    (l(
      R,
      ue.filter((k) => {
        const W = k.email;
        if (b.has(W)) return !1;
        const re = we(k);
        return W.toLowerCase().includes(d) || re.toLowerCase().includes(d);
      })
    ),
      l(L, !0));
  }
  async function A(d) {
    try {
      (l(v, !0), l(h, null));
      let b;
      (C() ? (b = await C()(d)) : (b = d),
        c([...c(), b]),
        f() && f()(c()),
        l(u, ''),
        l(R, []),
        l(L, !1));
    } catch (b) {
      const k = b instanceof Error ? b.message : 'Failed to add companion';
      if (k.includes('already exists') || k.includes('conflict')) {
        const W = we(d);
        (l(h, `${W} is already added`), n());
      } else l(h, k);
    } finally {
      l(v, !1);
    }
  }
  async function le(d) {
    try {
      (l(v, !0),
        l(h, null),
        console.log('[ItemCompanionsForm] handleRemoveCompanion called:', {
          companionId: d,
          companionsCount: c().length,
        }),
        g()
          ? (console.log('[ItemCompanionsForm] Calling onRemoveCompanion callback'), await g()(d))
          : console.log('[ItemCompanionsForm] No onRemoveCompanion callback provided'),
        console.log('[ItemCompanionsForm] Filtering companions:', {
          companionId: d,
          beforeCount: c().length,
        }),
        c(c().filter((b) => b.id !== d)),
        console.log('[ItemCompanionsForm] After filter:', { afterCount: c().length }),
        f()
          ? (console.log('[ItemCompanionsForm] Calling onCompanionsUpdate callback'), f()(c()))
          : console.log('[ItemCompanionsForm] No onCompanionsUpdate callback provided'));
    } catch (b) {
      (l(h, b instanceof Error ? b.message : 'Failed to remove companion'),
        console.error('[ItemCompanionsForm] Error removing companion:', b));
    } finally {
      l(v, !1);
    }
  }
  function ye(d) {
    d.target.closest('.search-container') || l(L, !1);
  }
  (fa(
    () => Se(c()),
    () => {
      console.log('[ItemCompanionsForm] Props:', {
        companionsLength: c()?.length || 0,
        companions: c(),
      });
    }
  ),
    sr(),
    aa());
  var ge = yi();
  z('click', rn, ye);
  var I = r(a(ge), 2);
  {
    var se = (d) => {
      Ha(d, {
        type: 'error',
        get message() {
          return e(h);
        },
        dismissible: !0,
      });
    };
    S(I, (d) => {
      e(h) && d(se);
    });
  }
  var xe = r(I, 2),
    J = a(xe),
    F = a(J);
  fe(F);
  var j = r(F, 2);
  {
    var K = (d) => {
      var b = ui();
      (V(() => (b.disabled = e(v))),
        z('click', b, () => {
          (l(u, ''), l(R, []), l(L, !1));
        }),
        p(d, b));
    };
    S(j, (d) => {
      e(u) && d(K);
    });
  }
  t(J);
  var X = r(J, 2);
  {
    var y = (d) => {
        var b = mi();
        (bt(
          b,
          5,
          () => e(R),
          (k) => k.id,
          (k, W) => {
            var re = pi(),
              ie = a(re),
              ce = a(ie, !0);
            t(ie);
            var B = r(ie, 2),
              Z = a(B, !0);
            (t(B),
              t(re),
              V(
                (G) => {
                  ((re.disabled = e(v)), O(ce, G), O(Z, (e(W), s(() => e(W).email))));
                },
                [() => (e(W), s(() => we(e(W))))]
              ),
              z('click', re, () => A(e(W))),
              p(k, re));
          }
        ),
          t(b),
          p(d, b));
      },
      Q = (d) => {
        var b = he(),
          k = oe(b);
        {
          var W = (re) => {
            var ie = fi();
            p(re, ie);
          };
          S(
            k,
            (re) => {
              (e(L), e(u), e(R), s(() => e(L) && e(u).trim() && e(R).length === 0) && re(W));
            },
            !0
          );
        }
        p(d, b);
      };
    S(X, (d) => {
      (e(L), e(R), s(() => e(L) && e(R).length > 0) ? d(y) : d(Q, !1));
    });
  }
  t(xe);
  var E = r(xe, 2);
  {
    var M = (d) => {
        var b = gi(),
          k = r(a(b), 2);
        (bt(
          k,
          1,
          c,
          (W) => W.id,
          (W, re) => {
            var ie = hi(),
              ce = a(ie),
              B = a(ce),
              Z = a(B, !0);
            (t(B), t(ce));
            var G = r(ce, 2);
            (t(ie),
              V(
                (U) => {
                  (O(Z, U), (G.disabled = e(v)));
                },
                [() => (e(re), s(() => we(e(re))))]
              ),
              z('click', G, () => le(e(re).companionId || e(re).id)),
              p(W, ie));
          }
        ),
          t(b),
          p(d, b));
      },
      P = (d) => {
        var b = _i();
        p(d, b);
      };
    S(E, (d) => {
      (Se(c()), s(() => c() && c().length > 0) ? d(M) : d(P, !1));
    });
  }
  (t(ge),
    V(() => (F.disabled = e(v))),
    me(
      F,
      () => e(u),
      (d) => l(u, d)
    ),
    z('input', F, n),
    z('focus', F, () => {
      e(u).trim() && l(L, !0);
    }),
    p(i, ge),
    ta());
}
var xi = w('<button class="clear-btn svelte-2ng4py">✕</button>'),
  Ti = w(
    '<button class="result-item svelte-2ng4py"><span class="result-name svelte-2ng4py"> </span> <span class="result-email svelte-2ng4py"> </span></button>'
  ),
  Di = w('<div class="search-results svelte-2ng4py"></div>'),
  wi = w(
    '<div class="search-results empty svelte-2ng4py"><p class="svelte-2ng4py">No companions found</p></div>'
  ),
  Ci = w(
    '<div class="companion-item svelte-2ng4py"><div class="companion-info svelte-2ng4py"><span class="companion-name svelte-2ng4py"> </span></div> <div class="permission-cell svelte-2ng4py"><input type="checkbox" class="permission-checkbox svelte-2ng4py"/></div> <button class="remove-btn svelte-2ng4py" title="Remove companion">✕</button></div>'
  ),
  ki = w(
    '<div class="companions-list svelte-2ng4py"><div class="list-header svelte-2ng4py"><span>Name</span> <span class="permission-col svelte-2ng4py">Can Edit</span> <span class="action-col svelte-2ng4py"></span></div> <!></div>'
  ),
  Ei = w('<p class="no-companions svelte-2ng4py">No companions added yet</p>'),
  ji = w(
    '<div class="trip-companions-form svelte-2ng4py"><h4 class="section-title svelte-2ng4py">Travel Companions</h4> <!> <div class="search-container svelte-2ng4py"><div class="search-box svelte-2ng4py"><input type="text" placeholder="Search companions by name or email..." class="search-input svelte-2ng4py"/> <!></div> <!></div> <!></div>'
  );
function Ni(i, o) {
  ea(o, !1);
  let c = Ae(o, 'tripId', 8),
    f = Ae(o, 'companions', 28, () => []),
    C = Ae(o, 'onCompanionsUpdate', 8, null),
    g = ne(''),
    u = ne(!1),
    v = ne(null),
    h = ne([]),
    R = ne(!1),
    L = [],
    ue = !0;
  async function te() {
    try {
      ue = !0;
      const d = await kr.getAll();
      L = Array.isArray(d) ? d : d?.data || [];
    } catch (d) {
      (console.error('Failed to load companions:', d), (L = []));
    } finally {
      ue = !1;
    }
  }
  Ga(() => {
    te();
  });
  function ve(d) {
    const b = d.companion || d;
    return b.firstName && b.lastName
      ? `${b.firstName} ${b.lastName}`
      : b.firstName
        ? b.firstName
        : b.lastName
          ? b.lastName
          : b.email;
  }
  function we(d) {
    return d.companion?.email || d.email;
  }
  function _e() {
    if (!e(g).trim()) {
      (l(h, []), l(R, !1));
      return;
    }
    const d = e(g).toLowerCase(),
      b = new Set(f().map((k) => we(k)));
    (l(
      h,
      L.filter((k) => {
        const W = k.email;
        if (b.has(W)) return !1;
        const re = ve(k);
        return W.toLowerCase().includes(d) || re.toLowerCase().includes(d);
      })
    ),
      l(R, !0));
  }
  async function n(d) {
    try {
      (l(u, !0), l(v, null));
      const b = await kr.addToTrip(c(), d.id, !1);
      (f([...f(), b]), C() && C()(f()), l(g, ''), l(h, []), l(R, !1));
    } catch (b) {
      const k = b instanceof Error ? b.message : 'Failed to add companion';
      if (k.includes('already exists') || k.includes('conflict')) {
        const W = ve(d);
        (l(v, `${W} is already added to this trip`), _e());
      } else l(v, k);
    } finally {
      l(u, !1);
    }
  }
  async function A(d) {
    try {
      (l(u, !0),
        l(v, null),
        console.log('[TripCompanionsForm] Removing companion from trip:', {
          tripId: c(),
          companionId: d,
        }),
        console.log('[TripCompanionsForm] Current companions before filter:', f()),
        await kr.removeFromTrip(c(), d),
        console.log('[TripCompanionsForm] Companion removed successfully from API'));
      const b = f().length;
      (f(
        f().filter((k) => {
          const W = k.id === d || k.companionId === d;
          return (
            console.log(
              `[TripCompanionsForm] Checking companion ${k.id} (companionId: ${k.companionId}) against ${d}: ${W ? 'MATCH (remove)' : 'no match (keep)'}`
            ),
            !W
          );
        })
      ),
        console.log(
          '[TripCompanionsForm] Companion filtered from local list, before:',
          b,
          'after:',
          f().length
        ),
        C()
          ? (console.log(
              '[TripCompanionsForm] Calling onCompanionsUpdate callback with',
              f().length,
              'companions'
            ),
            C()(f()))
          : console.log('[TripCompanionsForm] No onCompanionsUpdate callback provided'));
    } catch (b) {
      (l(v, b instanceof Error ? b.message : 'Failed to remove companion'),
        console.error('[TripCompanionsForm] Error removing companion:', b));
    } finally {
      l(u, !1);
    }
  }
  function le(d) {
    const b = f().find((k) => k.id === d);
    b && ((b.canEdit = !b.canEdit), f(f()), C() && C()(f()));
  }
  function ye(d) {
    d.target.closest('.search-container') || l(R, !1);
  }
  aa();
  var ge = ji();
  z('click', rn, ye);
  var I = r(a(ge), 2);
  {
    var se = (d) => {
      Ha(d, {
        type: 'error',
        get message() {
          return e(v);
        },
        dismissible: !0,
      });
    };
    S(I, (d) => {
      e(v) && d(se);
    });
  }
  var xe = r(I, 2),
    J = a(xe),
    F = a(J);
  fe(F);
  var j = r(F, 2);
  {
    var K = (d) => {
      var b = xi();
      (V(() => (b.disabled = e(u))),
        z('click', b, () => {
          (l(g, ''), l(h, []), l(R, !1));
        }),
        p(d, b));
    };
    S(j, (d) => {
      e(g) && d(K);
    });
  }
  t(J);
  var X = r(J, 2);
  {
    var y = (d) => {
        var b = Di();
        (bt(
          b,
          5,
          () => e(h),
          (k) => k.id,
          (k, W) => {
            var re = Ti(),
              ie = a(re),
              ce = a(ie, !0);
            t(ie);
            var B = r(ie, 2),
              Z = a(B, !0);
            (t(B),
              t(re),
              V(
                (G) => {
                  ((re.disabled = e(u)), O(ce, G), O(Z, (e(W), s(() => e(W).email))));
                },
                [() => (e(W), s(() => ve(e(W))))]
              ),
              z('click', re, () => n(e(W))),
              p(k, re));
          }
        ),
          t(b),
          p(d, b));
      },
      Q = (d) => {
        var b = he(),
          k = oe(b);
        {
          var W = (re) => {
            var ie = wi();
            p(re, ie);
          };
          S(
            k,
            (re) => {
              (e(R), e(g), e(h), s(() => e(R) && e(g).trim() && e(h).length === 0) && re(W));
            },
            !0
          );
        }
        p(d, b);
      };
    S(X, (d) => {
      (e(R), e(h), s(() => e(R) && e(h).length > 0) ? d(y) : d(Q, !1));
    });
  }
  t(xe);
  var E = r(xe, 2);
  {
    var M = (d) => {
        var b = ki(),
          k = r(a(b), 2);
        (bt(
          k,
          1,
          f,
          (W) => W.id,
          (W, re) => {
            var ie = Ci(),
              ce = a(ie),
              B = a(ce),
              Z = a(B, !0);
            (t(B), t(ce));
            var G = r(ce, 2),
              U = a(G);
            (fe(U), t(G));
            var pe = r(G, 2);
            (t(ie),
              V(
                ($e) => {
                  (O(Z, $e),
                    Cr(U, (e(re), s(() => e(re).canEdit))),
                    (U.disabled = e(u)),
                    Ye(
                      U,
                      'title',
                      (e(re),
                      s(() =>
                        e(re).canEdit ? 'Click to make view-only' : 'Click to allow editing'
                      ))
                    ),
                    (pe.disabled = e(u)));
                },
                [() => (e(re), s(() => ve(e(re))))]
              ),
              z('change', U, () => le(e(re).id)),
              z('click', pe, () => A(e(re).companionId || e(re).id)),
              p(W, ie));
          }
        ),
          t(b),
          p(d, b));
      },
      P = (d) => {
        var b = Ei();
        p(d, b);
      };
    S(E, (d) => {
      (Se(f()), s(() => f() && f().length > 0) ? d(M) : d(P, !1));
    });
  }
  (t(ge),
    V(() => (F.disabled = e(u))),
    me(
      F,
      () => e(g),
      (d) => l(g, d)
    ),
    z('input', F, _e),
    z('focus', F, () => {
      e(g).trim() && l(R, !0);
    }),
    p(i, ge),
    ta());
}
var Si = w('<div class="error-message"> </div>'),
  Ii = w('<option> </option>'),
  Mi = w(
    '<div class="form-group"><label for="tripSelector">Trip</label> <select id="tripSelector"><option>Standalone Item</option><!></select></div>'
  ),
  $i = w('<span class="loading-indicator">Looking up...</span>'),
  Ai = w(
    '<div class="form-row cols-3"><div class="form-group"><label for="flightNumber"> </label> <input type="text" id="flightNumber" name="flightNumber" placeholder="KL668"/></div> <div class="form-group" style="grid-column: span 2;"><label for="airline"> <!></label> <input type="text" id="airline" name="airline" readonly="" class="readonly"/></div></div> <div class="form-row cols-2"><div class="form-group"><label for="origin">Origin</label> <!></div> <div class="form-group"><label for="destination">Destination</label> <!></div></div> <div class="form-row cols-2"><div class="form-group"><label for="departureDate">Departure Date</label> <input type="date" id="departureDate" name="departureDate"/></div> <div class="form-group"><label for="departureTime">Departure Time</label> <input type="text" id="departureTime" name="departureTime" placeholder="HH:MM" maxlength="5"/></div></div> <div class="form-row cols-2"><div class="form-group"><label for="arrivalDate">Arrival Date</label> <input type="date" id="arrivalDate" name="arrivalDate"/></div> <div class="form-group"><label for="arrivalTime">Arrival Time</label> <input type="text" id="arrivalTime" name="arrivalTime" placeholder="HH:MM" maxlength="5"/></div></div> <div class="form-row cols-3"><div class="form-group" style="grid-column: span 2;"><label for="pnr">PNR</label> <input type="text" id="pnr" name="pnr" placeholder="ABC123D"/></div> <div class="form-group"><label for="seat">Seat</label> <input type="text" id="seat" name="seat" placeholder="4A"/></div></div>',
    1
  ),
  qi = w(
    '<div class="form-group"><label for="name">Hotel Name</label> <input type="text" id="name" name="name" placeholder="W Bangkok" required/></div> <div class="form-group"><label for="address">Address</label> <textarea id="address" name="address" placeholder="Full address"></textarea></div> <div class="form-row cols-2"><div class="form-group"><label for="checkInDate">Check-in Date</label> <input type="date" id="checkInDate" name="checkInDate" required/></div> <div class="form-group"><label for="checkInTime">Check-in Time</label> <input type="text" id="checkInTime" name="checkInTime" placeholder="HH:MM" maxlength="5"/></div></div> <div class="form-row cols-2"><div class="form-group"><label for="checkOutDate">Check-out Date</label> <input type="date" id="checkOutDate" name="checkOutDate" required/></div> <div class="form-group"><label for="checkOutTime">Check-out Time</label> <input type="text" id="checkOutTime" name="checkOutTime" placeholder="HH:MM" maxlength="5"/></div></div> <div class="form-group"><label for="confirmationNumber">Confirmation Number</label> <input type="text" id="confirmationNumber" name="confirmationNumber"/></div> <div class="form-group"><label for="notes">Notes</label> <textarea id="notes" name="notes" placeholder="Additional information"></textarea></div>',
    1
  ),
  Pi = w('<option> </option>'),
  Ri = w('<option> </option>'),
  Li = w(
    '<div class="form-group"><label for="method">Method</label> <select id="method" name="method" required><option>Select Method</option><!></select></div> <div class="form-row cols-2"><div class="form-group"><label for="origin">From</label> <input type="text" id="origin" name="origin" required/></div> <div class="form-group"><label for="destination">To</label> <input type="text" id="destination" name="destination" required/></div></div> <div class="form-row cols-2"><div class="form-group"><label for="departureDate">Departure Date</label> <input type="date" id="departureDate" name="departureDate" required/></div> <div class="form-group"><label for="departureTime">Departure Time</label> <input type="text" id="departureTime" name="departureTime" placeholder="HH:MM" maxlength="5"/></div></div> <div class="form-row cols-2"><div class="form-group"><label for="arrivalDate">Arrival Date</label> <input type="date" id="arrivalDate" name="arrivalDate" required/></div> <div class="form-group"><label for="arrivalTime">Arrival Time</label> <input type="text" id="arrivalTime" name="arrivalTime" placeholder="HH:MM" maxlength="5"/></div></div> <div class="form-group"><label for="bookingReference">Booking Reference</label> <input type="text" id="bookingReference" name="bookingReference"/></div> <div class="form-group"><label for="notes">Notes</label> <textarea id="notes" name="notes" placeholder="Additional information"></textarea></div>',
    1
  ),
  Fi = w(
    '<div class="form-row cols-2"><div class="form-group"><label for="company">Company</label> <input type="text" id="company" name="company" required/></div> <div class="form-group"><label for="pickupLocation">Pickup Location</label> <input type="text" id="pickupLocation" name="pickupLocation" required/></div></div> <div class="form-row cols-2"><div class="form-group"><label for="pickupDate">Pickup Date</label> <input type="date" id="pickupDate" name="pickupDate" required/></div> <div class="form-group"><label for="pickupTime">Pickup Time</label> <input type="text" id="pickupTime" name="pickupTime" placeholder="HH:MM" maxlength="5"/></div></div> <div class="form-group"><label for="dropoffLocation">Dropoff Location</label> <input type="text" id="dropoffLocation" name="dropoffLocation" required/></div> <div class="form-row cols-2"><div class="form-group"><label for="dropoffDate">Dropoff Date</label> <input type="date" id="dropoffDate" name="dropoffDate" required/></div> <div class="form-group"><label for="dropoffTime">Dropoff Time</label> <input type="text" id="dropoffTime" name="dropoffTime" placeholder="HH:MM" maxlength="5"/></div></div> <div class="form-group"><label for="confirmationNumber">Confirmation Number</label> <input type="text" id="confirmationNumber" name="confirmationNumber"/></div> <div class="form-group"><label for="notes">Notes</label> <textarea id="notes" name="notes" placeholder="Additional information"></textarea></div>',
    1
  ),
  Oi = w(
    '<div class="form-row cols-2"><div class="form-group"><label for="startDate">Start Date</label> <input type="date" id="startDate" name="startDate" required/></div> <div class="form-group"><label for="endDate">End Date</label> <input type="date" id="endDate" name="endDate"/></div></div>'
  ),
  zi = w(
    '<div class="form-row cols-2"><div class="form-group"><label for="startDate">Start Date</label> <input type="date" id="startDate" name="startDate" required/></div> <div class="form-group"><label for="startTime">Start Time</label> <input type="text" id="startTime" name="startTime" placeholder="HH:MM" maxlength="5"/></div></div> <div class="form-row cols-2"><div class="form-group"><label for="endDate">End Date</label> <input type="date" id="endDate" name="endDate"/></div> <div class="form-group"><label for="endTime">End Time</label> <input type="text" id="endTime" name="endTime" placeholder="HH:MM" maxlength="5"/></div></div>',
    1
  ),
  Ui = w(
    '<div class="form-group"><label for="name">Event Name</label> <input type="text" id="name" name="name" required/></div> <div class="form-group"><label for="location">Location</label> <input type="text" id="location" name="location" required/></div> <div class="form-group checkbox-group svelte-diniqf"><label for="allDay" class="svelte-diniqf"><input type="checkbox" id="allDay" name="allDay" class="svelte-diniqf"/> <span class="svelte-diniqf">All Day Event</span></label></div> <!> <div class="form-group"><label for="ticketNumber">Ticket Number</label> <input type="text" id="ticketNumber" name="ticketNumber"/></div> <div class="form-group"><label for="description">Description</label> <textarea id="description" name="description" placeholder="Event details"></textarea></div> <div class="form-group"><label for="notes">Notes</label> <textarea id="notes" name="notes" placeholder="Additional information"></textarea></div>',
    1
  ),
  Hi = w('<div class="form-group"><label> </label> <input type="date"/></div>'),
  Bi = w(
    '<div class="form-row cols-2"><div class="form-group"><label> </label> <input type="date"/></div> <!></div>'
  ),
  Vi = w('<input type="text"/>'),
  Ji = w('<input type="date"/>'),
  Gi = w('<input type="text" maxlength="5"/>'),
  Yi = w('<option> </option>'),
  Wi = w('<option> </option>'),
  Zi = w('<select><option> </option><!></select>'),
  Ki = w('<textarea></textarea>'),
  Xi = w('<div class="form-group"><label> </label> <!></div>'),
  Qi = w('<input type="text"/>'),
  es = w('<input type="date"/>'),
  ts = w('<input type="text" maxlength="5"/>'),
  as = w('<option> </option>'),
  rs = w('<select><option> </option><!></select>'),
  ns = w('<textarea></textarea>'),
  is = w('<div class="form-group"><label> </label> <!></div>'),
  ss = w('<div class="form-group"><!></div>'),
  os = w('<button type="button" class="delete-btn">Delete</button>'),
  ls = w(
    '<div class="edit-panel"><div class="edit-header"><div class="header-left"><button class="back-btn"><svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button> <h3> </h3></div> <div class="icon-badge"><span class="material-symbols-outlined"> </span></div></div> <form class="edit-content"><!> <div class="form-fields"><!> <!></div> <!> <!> <div class="form-buttons"><button type="submit" class="submit-btn"> </button> <button type="button" class="cancel-btn">Cancel</button></div> <!></form></div>'
  );
function ds(i, o) {
  ea(o, !1);
  const c = ne(),
    f = ne(),
    C = ne(),
    g = ne();
  let u = Ae(o, 'itemType', 8),
    v = Ae(o, 'data', 12, null),
    h = Ae(o, 'tripId', 8, ''),
    R = Ae(o, 'allTrips', 24, () => []),
    L = Ae(o, 'onClose', 8, () => {}),
    ue = Ae(o, 'onSave', 8, () => {}),
    te = ne(!1),
    ve = ne(null);
  function we(N) {
    if (!N) return new Date(0);
    const [ee, ae, ke] = N.split('-').map(Number);
    return new Date(ee, ae - 1, ke, 0, 0, 0, 0);
  }
  function _e(N) {
    if (!N) return {};
    const ee = { ...N };
    if (u() === 'flight' && N.departureDateTime) {
      const ae = Ma(N.departureDateTime, N.originTimezone);
      if (ae) {
        const [ke, ze] = ae.split('T');
        ((ee.departureDate = ke), (ee.departureTime = ze));
      }
      if (N.arrivalDateTime) {
        const ke = Ma(N.arrivalDateTime, N.destinationTimezone);
        if (ke) {
          const [ze, Ge] = ke.split('T');
          ((ee.arrivalDate = ze), (ee.arrivalTime = Ge));
        }
      }
    }
    if (u() === 'hotel' && N.checkInDateTime) {
      const ae = Ma(N.checkInDateTime, N.timezone);
      if (ae) {
        const [ke, ze] = ae.split('T');
        ((ee.checkInDate = ke), (ee.checkInTime = ze));
      }
      if (N.checkOutDateTime) {
        const ke = Ma(N.checkOutDateTime, N.timezone);
        if (ke) {
          const [ze, Ge] = ke.split('T');
          ((ee.checkOutDate = ze), (ee.checkOutTime = Ge));
        }
      }
    }
    if (
      (u() === 'hotel' && N.hotelName && !N.name && (ee.name = N.hotelName),
      u() === 'event' && N.startDateTime)
    ) {
      const ae = Ma(N.startDateTime, N.timezone);
      if (ae) {
        const [ke, ze] = ae.split('T');
        ((ee.startDate = ke), (ee.startTime = ze));
      }
      if (N.endDateTime) {
        const ke = Ma(N.endDateTime, N.timezone);
        if (ke) {
          const [ze, Ge] = ke.split('T');
          ((ee.endDate = ze), (ee.endTime = Ge));
        }
      }
      ee.startTime === '00:00' && ee.endTime === '23:59' && (ee.allDay = !0);
    }
    if (u() === 'transportation' && N.departureDateTime) {
      const ae = Ma(N.departureDateTime, N.originTimezone);
      if (ae) {
        const [ke, ze] = ae.split('T');
        ((ee.departureDate = ke), (ee.departureTime = ze));
      }
      if (N.arrivalDateTime) {
        const ke = Ma(N.arrivalDateTime, N.destinationTimezone);
        if (ke) {
          const [ze, Ge] = ke.split('T');
          ((ee.arrivalDate = ze), (ee.arrivalTime = Ge));
        }
      }
    }
    if (u() === 'carRental' && N.pickupDateTime) {
      const ae = Ma(N.pickupDateTime, N.pickupTimezone);
      if (ae) {
        const [ke, ze] = ae.split('T');
        ((ee.pickupDate = ke), (ee.pickupTime = ze));
      }
      if (N.dropoffDateTime) {
        const ke = Ma(N.dropoffDateTime, N.dropoffTimezone);
        if (ke) {
          const [ze, Ge] = ke.split('T');
          ((ee.dropoffDate = ze), (ee.dropoffTime = Ge));
        }
      }
    }
    return ee;
  }
  let n = ne(_e(v())),
    A = ne(!1),
    le = ne(''),
    ye = ne([]);
  async function ge() {
    if (!(u() !== 'flight' || !e(n).flightNumber)) {
      l(A, !0);
      try {
        const N = await ar.lookupAirline(e(n).flightNumber);
        N && N.name && Y(n, (e(n).airline = N.name));
      } catch (N) {
        console.debug('Airline lookup failed:', N);
      } finally {
        l(A, !1);
      }
    }
  }
  function I(N) {
    const ee = N.target;
    let ae = ee.value.replace(/\D/g, '');
    (ae.length > 0 &&
      (ae.length <= 2
        ? (ae = ae)
        : ae.length === 3
          ? (ae = ae.slice(0, 2) + ':' + ae.slice(2))
          : (ae = ae.slice(0, 2) + ':' + ae.slice(2, 4))),
      (ee.value = ae));
    const ke = ee.name;
    ke &&
      (Y(n, (e(n)[ke] = ae)), console.log('[ItemEditForm] formatTimeInput updated', ke, '=', ae));
  }
  function se() {
    return {
      trip: {
        title: e(c) ? 'Edit Trip' : 'Add Trip',
        fields: [
          {
            name: 'name',
            label: 'Trip Name',
            type: 'text',
            required: !0,
            placeholder: 'Summer Vacation',
          },
          {
            name: 'purpose',
            label: 'Purpose',
            type: 'select',
            options: [
              { value: 'leisure', label: 'Leisure' },
              { value: 'business', label: 'Business' },
              { value: 'family', label: 'Family' },
              { value: 'romantic', label: 'Romantic' },
              { value: 'adventure', label: 'Adventure' },
            ],
            required: !0,
          },
          { name: 'departureDate', label: 'Departure Date', type: 'date', required: !0 },
          { name: 'returnDate', label: 'Return Date', type: 'date', required: !0 },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ],
      },
      flight: {
        title: e(c) ? 'Edit Flight' : 'Add Flight',
        fields: [
          {
            name: 'flightNumber',
            label: 'Flight Number',
            type: 'text',
            required: !0,
            placeholder: 'KL668',
          },
          { name: 'airline', label: 'Airline', type: 'text', readonly: !0 },
          { name: 'origin', label: 'Origin', type: 'airport', required: !0, placeholder: 'AUS' },
          {
            name: 'destination',
            label: 'Destination',
            type: 'airport',
            required: !0,
            placeholder: 'AMS',
          },
          { name: 'departureDate', label: 'Departure Date', type: 'date', required: !0 },
          {
            name: 'departureTime',
            label: 'Departure Time',
            type: 'time',
            required: !0,
            placeholder: 'HH:MM',
          },
          { name: 'arrivalDate', label: 'Arrival Date', type: 'date', required: !0 },
          {
            name: 'arrivalTime',
            label: 'Arrival Time',
            type: 'time',
            required: !0,
            placeholder: 'HH:MM',
          },
          { name: 'pnr', label: 'PNR', type: 'text', placeholder: 'ABC123D' },
          { name: 'seat', label: 'Seat', type: 'text', placeholder: '4A' },
        ],
      },
      hotel: {
        title: e(c) ? 'Edit Hotel' : 'Add Hotel',
        fields: [
          { name: 'name', label: 'Hotel Name', type: 'text', required: !0 },
          { name: 'address', label: 'Address', type: 'text', required: !0 },
          { name: 'checkInDate', label: 'Check In Date', type: 'date', required: !0 },
          { name: 'checkInTime', label: 'Check In Time', type: 'time', placeholder: 'HH:MM' },
          { name: 'checkOutDate', label: 'Check Out Date', type: 'date', required: !0 },
          { name: 'checkOutTime', label: 'Check Out Time', type: 'time', placeholder: 'HH:MM' },
          { name: 'confirmationNumber', label: 'Confirmation Number', type: 'text' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ],
      },
      transportation: {
        title: e(c) ? 'Edit Transportation' : 'Add Transportation',
        fields: [
          {
            name: 'method',
            label: 'Method',
            type: 'select',
            options: [
              { value: 'train', label: 'Train' },
              { value: 'bus', label: 'Bus' },
              { value: 'ferry', label: 'Ferry' },
              { value: 'shuttle', label: 'Shuttle' },
              { value: 'taxi', label: 'Taxi' },
              { value: 'rideshare', label: 'Rideshare' },
              { value: 'subway', label: 'Subway' },
              { value: 'metro', label: 'Metro' },
              { value: 'tram', label: 'Tram' },
              { value: 'other', label: 'Other' },
            ],
            required: !0,
          },
          { name: 'origin', label: 'From', type: 'text', required: !0 },
          { name: 'destination', label: 'To', type: 'text', required: !0 },
          { name: 'departureDate', label: 'Departure Date', type: 'date', required: !0 },
          { name: 'departureTime', label: 'Departure Time', type: 'time', placeholder: 'HH:MM' },
          { name: 'arrivalDate', label: 'Arrival Date', type: 'date', required: !0 },
          { name: 'arrivalTime', label: 'Arrival Time', type: 'time', placeholder: 'HH:MM' },
          { name: 'bookingReference', label: 'Booking Reference', type: 'text' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ],
      },
      carRental: {
        title: e(c) ? 'Edit Car Rental' : 'Add Car Rental',
        fields: [
          { name: 'company', label: 'Company', type: 'text', required: !0 },
          { name: 'pickupLocation', label: 'Pickup Location', type: 'text', required: !0 },
          { name: 'pickupDate', label: 'Pickup Date', type: 'date', required: !0 },
          { name: 'pickupTime', label: 'Pickup Time', type: 'time', placeholder: 'HH:MM' },
          { name: 'dropoffLocation', label: 'Dropoff Location', type: 'text', required: !0 },
          { name: 'dropoffDate', label: 'Dropoff Date', type: 'date', required: !0 },
          { name: 'dropoffTime', label: 'Dropoff Time', type: 'time', placeholder: 'HH:MM' },
          { name: 'confirmationNumber', label: 'Confirmation Number', type: 'text' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ],
      },
      event: {
        title: e(c) ? 'Edit Event' : 'Add Event',
        fields: [
          { name: 'name', label: 'Event Name', type: 'text', required: !0 },
          { name: 'location', label: 'Location', type: 'text', required: !0 },
          { name: 'startDate', label: 'Start Date', type: 'date', required: !0 },
          { name: 'endDate', label: 'End Date', type: 'date' },
          { name: 'allDay', label: 'All Day Event', type: 'checkbox' },
          { name: 'startTime', label: 'Start Time', type: 'time', placeholder: 'HH:MM' },
          { name: 'endTime', label: 'End Time', type: 'time', placeholder: 'HH:MM' },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'ticketNumber', label: 'Ticket Number', type: 'text' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ],
      },
    };
  }
  async function xe() {
    (l(te, !0), l(ve, null));
    try {
      let N;
      const ee = e(le) || h(),
        ae = { ...e(n) };
      if (
        (u() === 'flight' || u() === 'transportation'
          ? (delete ae.departureDateTime, delete ae.arrivalDateTime)
          : u() === 'hotel'
            ? (delete ae.checkInDateTime, delete ae.checkOutDateTime)
            : u() === 'carRental'
              ? (delete ae.pickupDateTime, delete ae.dropoffDateTime)
              : u() === 'event' && (delete ae.startDateTime, delete ae.endDateTime),
        u() !== 'trip' && (e(c) ? (ae.tripId = e(le) || null) : e(le) && (ae.tripId = e(le))),
        console.log('[ItemEditForm] Before submit - formData:', {
          departureDate: e(n).departureDate,
          departureTime: e(n).departureTime,
          arrivalDate: e(n).arrivalDate,
          arrivalTime: e(n).arrivalTime,
          originTimezone: e(n).originTimezone,
          destinationTimezone: e(n).destinationTimezone,
        }),
        console.log('[ItemEditForm] Submitting:', {
          itemType: u(),
          isEditing: e(c),
          tripId: ee,
          data: ae,
        }),
        u() === 'trip'
          ? e(c)
            ? (N = await ir.update(v().id, e(n)))
            : (N = await ir.create(e(n)))
          : u() === 'flight'
            ? e(c)
              ? (console.log('[ItemEditForm] Updating flight with:', ae),
                (N = await ar.update(v().id, ae)))
              : (N = await ar.create(ee, ae))
            : u() === 'hotel'
              ? e(c)
                ? (N = await fr.update(v().id, ae))
                : (N = await fr.create(ee, ae))
              : u() === 'event'
                ? e(c)
                  ? (N = await hr.update(v().id, ae))
                  : (N = await hr.create(ee, ae))
                : u() === 'transportation'
                  ? e(c)
                    ? (N = await gr.update(v().id, ae))
                    : (N = await gr.create(ee, ae))
                  : u() === 'carRental' &&
                    (e(c) ? (N = await _r.update(v().id, ae)) : (N = await _r.create(ee, ae))),
        console.log('[ItemEditForm] Save successful, result:', N),
        e(ye) && e(ye).length > 0 && N && N.id)
      )
        try {
          const ke = e(ye).map((ze) => ze.id);
          (await qr.update(u(), N.id, ke),
            console.log('[ItemEditForm] Companions saved successfully'),
            u() === 'flight'
              ? (N = await ar.getById(N.id))
              : u() === 'hotel'
                ? (N = await fr.getById(N.id))
                : u() === 'event'
                  ? (N = await hr.getById(N.id))
                  : u() === 'transportation'
                    ? (N = await gr.getById(N.id))
                    : u() === 'carRental' && (N = await _r.getById(N.id)));
        } catch (ke) {
          console.error('[ItemEditForm] Error saving companions:', ke);
        }
      (ue()(N || ae), L()());
    } catch (N) {
      (console.error('[ItemEditForm] Save failed:', N),
        l(ve, N instanceof Error ? N.message : 'An error occurred'));
    } finally {
      l(te, !1);
    }
  }
  function J(N) {
    return (
      {
        trip: 'flight_takeoff',
        flight: 'flight',
        hotel: 'hotel',
        event: 'event',
        transportation: 'directions_car',
        carRental: 'directions_car',
        voucher: 'card_giftcard',
      }[N] || 'info'
    );
  }
  async function F() {
    if (confirm(`Delete this ${u()}?`)) {
      (l(te, !0), l(ve, null));
      try {
        (u() === 'trip'
          ? await ir.delete(v().id)
          : u() === 'flight'
            ? await ar.delete(v().id)
            : u() === 'hotel'
              ? await fr.delete(v().id)
              : u() === 'event'
                ? await hr.delete(v().id)
                : u() === 'transportation'
                  ? await gr.delete(v().id)
                  : u() === 'carRental' && (await _r.delete(v().id)),
          ue()(null),
          L()());
      } catch (N) {
        const ee = N instanceof Error ? N.message : String(N);
        ee.includes('pattern') || ee.includes('string')
          ? (console.debug('Ignoring validation error after delete:', ee), ue()(null), L()())
          : l(ve, ee);
      } finally {
        l(te, !1);
      }
    }
  }
  (fa(
    () => (Se(v()), Se(u())),
    () => {
      v() &&
        console.log('[ItemEditForm] Received data:', {
          itemType: u(),
          itemId: v().id,
          dataKeys: Object.keys(v()),
          itemCompanions: v().itemCompanions,
          hasCompanions: !!v().itemCompanions,
          companionCount: v().itemCompanions?.length || 0,
          fullData: v(),
        });
    }
  ),
    fa(
      () => Se(v()),
      () => {
        l(c, !!v()?.id);
      }
    ),
    fa(
      () => Se(v()),
      () => {
        if (v()) {
          const N = _e(v());
          (l(n, N),
            l(le, v()?.tripId || ''),
            l(ye, v()?.itemCompanions || v()?.travelCompanions || []));
        }
      }
    ),
    fa(
      () => (e(le), e(c), Se(u()), Se(v())),
      () => {
        console.log('[ItemEditForm] selectedTripId changed:', {
          selectedTripId: e(le),
          isEditing: e(c),
          itemType: u(),
          itemId: v()?.id,
        });
      }
    ),
    fa(
      () => Se(u()),
      () => {
        l(f, u() !== 'trip');
      }
    ),
    fa(
      () => Se(R()),
      () => {
        l(
          C,
          R().filter((N) => {
            const ee = new Date();
            ee.setHours(0, 0, 0, 0);
            const ae = N.departureDate ? we(N.departureDate) : null;
            return ae && ae >= ee;
          })
        );
      }
    ),
    fa(
      () => Se(u()),
      () => {
        l(g, se()[u()]);
      }
    ),
    sr(),
    aa());
  var j = ls(),
    K = a(j),
    X = a(K),
    y = a(X),
    Q = r(y, 2),
    E = a(Q, !0);
  (t(Q), t(X));
  var M = r(X, 2),
    P = a(M),
    d = a(P, !0);
  (t(P), t(M), t(K));
  var b = r(K, 2),
    k = a(b);
  {
    var W = (N) => {
      var ee = Si(),
        ae = a(ee, !0);
      (t(ee), V(() => O(ae, e(ve))), p(N, ee));
    };
    S(k, (N) => {
      e(ve) && N(W);
    });
  }
  var re = r(k, 2),
    ie = a(re);
  {
    var ce = (N) => {
      var ee = Mi(),
        ae = r(a(ee), 2);
      V(() => {
        (e(le),
          rr(() => {
            e(C);
          }));
      });
      var ke = a(ae);
      ke.value = ke.__value = '';
      var ze = r(ke);
      (bt(
        ze,
        1,
        () => e(C),
        (Ge) => Ge.id,
        (Ge, Dt) => {
          var qe = Ii(),
            m = a(qe, !0);
          t(qe);
          var $ = {};
          (V(() => {
            (O(m, (e(Dt), s(() => e(Dt).name))),
              $ !== ($ = (e(Dt), s(() => e(Dt).id))) &&
                (qe.value = (qe.__value = (e(Dt), s(() => e(Dt).id))) ?? ''));
          }),
            p(Ge, qe));
        }
      ),
        t(ae),
        t(ee),
        nr(
          ae,
          () => e(le),
          (Ge) => l(le, Ge)
        ),
        p(N, ee));
    };
    S(ie, (N) => {
      e(f) && N(ce);
    });
  }
  var B = r(ie, 2);
  {
    var Z = (N) => {
        var ee = Ai(),
          ae = oe(ee),
          ke = a(ae),
          ze = a(ke),
          Ge = a(ze, !0);
        t(ze);
        var Dt = r(ze, 2);
        (fe(Dt), t(ke));
        var qe = r(ke, 2),
          m = a(qe),
          $ = a(m),
          T = r($);
        {
          var _ = (Te) => {
            var rt = $i();
            p(Te, rt);
          };
          S(T, (Te) => {
            e(A) && Te(_);
          });
        }
        t(m);
        var q = r(m, 2);
        (fe(q), t(qe), t(ae));
        var de = r(ae, 2),
          Ie = a(de),
          Me = r(a(Ie), 2);
        (Gr(Me, {
          id: 'origin',
          placeholder: 'AUS',
          onSelect: (Te) => {
            Y(n, (e(n).origin = Te.iata));
          },
          get value() {
            return e(n).origin;
          },
          set value(Te) {
            Y(n, (e(n).origin = Te));
          },
          $$legacy: !0,
        }),
          t(Ie));
        var je = r(Ie, 2),
          Ue = r(a(je), 2);
        (Gr(Ue, {
          id: 'destination',
          placeholder: 'AMS',
          onSelect: (Te) => {
            Y(n, (e(n).destination = Te.iata));
          },
          get value() {
            return e(n).destination;
          },
          set value(Te) {
            Y(n, (e(n).destination = Te));
          },
          $$legacy: !0,
        }),
          t(je),
          t(de));
        var ot = r(de, 2),
          yt = a(ot),
          tt = r(a(yt), 2);
        (fe(tt), t(yt));
        var Qe = r(yt, 2),
          et = r(a(Qe), 2);
        (fe(et), t(Qe), t(ot));
        var ut = r(ot, 2),
          He = a(ut),
          be = r(a(He), 2);
        (fe(be), t(He));
        var Le = r(He, 2),
          We = r(a(Le), 2);
        (fe(We), t(Le), t(ut));
        var xt = r(ut, 2),
          x = a(xt),
          pt = r(a(x), 2);
        (fe(pt), t(x));
        var Fe = r(x, 2),
          lt = r(a(Fe), 2);
        (fe(lt),
          t(Fe),
          t(xt),
          V(
            (Te, rt) => {
              (O(Ge, Te), O($, `${rt ?? ''} `));
            },
            [
              () => (e(g), s(() => e(g).fields.find((Te) => Te.name === 'flightNumber')?.label)),
              () => (e(g), s(() => e(g).fields.find((Te) => Te.name === 'airline')?.label)),
            ]
          ),
          me(
            Dt,
            () => e(n).flightNumber,
            (Te) => Y(n, (e(n).flightNumber = Te))
          ),
          z('blur', Dt, ge),
          me(
            q,
            () => e(n).airline,
            (Te) => Y(n, (e(n).airline = Te))
          ),
          me(
            tt,
            () => e(n).departureDate,
            (Te) => Y(n, (e(n).departureDate = Te))
          ),
          me(
            et,
            () => e(n).departureTime,
            (Te) => Y(n, (e(n).departureTime = Te))
          ),
          z('keyup', et, I),
          me(
            be,
            () => e(n).arrivalDate,
            (Te) => Y(n, (e(n).arrivalDate = Te))
          ),
          me(
            We,
            () => e(n).arrivalTime,
            (Te) => Y(n, (e(n).arrivalTime = Te))
          ),
          z('keyup', We, I),
          me(
            pt,
            () => e(n).pnr,
            (Te) => Y(n, (e(n).pnr = Te))
          ),
          me(
            lt,
            () => e(n).seat,
            (Te) => Y(n, (e(n).seat = Te))
          ),
          p(N, ee));
      },
      G = (N) => {
        var ee = he(),
          ae = oe(ee);
        {
          var ke = (Ge) => {
              var Dt = qi(),
                qe = oe(Dt),
                m = r(a(qe), 2);
              (fe(m), t(qe));
              var $ = r(qe, 2),
                T = r(a($), 2);
              (Fa(T), t($));
              var _ = r($, 2),
                q = a(_),
                de = r(a(q), 2);
              (fe(de), t(q));
              var Ie = r(q, 2),
                Me = r(a(Ie), 2);
              (fe(Me), t(Ie), t(_));
              var je = r(_, 2),
                Ue = a(je),
                ot = r(a(Ue), 2);
              (fe(ot), t(Ue));
              var yt = r(Ue, 2),
                tt = r(a(yt), 2);
              (fe(tt), t(yt), t(je));
              var Qe = r(je, 2),
                et = r(a(Qe), 2);
              (fe(et), t(Qe));
              var ut = r(Qe, 2),
                He = r(a(ut), 2);
              (Fa(He),
                t(ut),
                me(
                  m,
                  () => e(n).name,
                  (be) => Y(n, (e(n).name = be))
                ),
                me(
                  T,
                  () => e(n).address,
                  (be) => Y(n, (e(n).address = be))
                ),
                me(
                  de,
                  () => e(n).checkInDate,
                  (be) => Y(n, (e(n).checkInDate = be))
                ),
                me(
                  Me,
                  () => e(n).checkInTime,
                  (be) => Y(n, (e(n).checkInTime = be))
                ),
                z('keyup', Me, I),
                me(
                  ot,
                  () => e(n).checkOutDate,
                  (be) => Y(n, (e(n).checkOutDate = be))
                ),
                me(
                  tt,
                  () => e(n).checkOutTime,
                  (be) => Y(n, (e(n).checkOutTime = be))
                ),
                z('keyup', tt, I),
                me(
                  et,
                  () => e(n).confirmationNumber,
                  (be) => Y(n, (e(n).confirmationNumber = be))
                ),
                me(
                  He,
                  () => e(n).notes,
                  (be) => Y(n, (e(n).notes = be))
                ),
                p(Ge, Dt));
            },
            ze = (Ge) => {
              var Dt = he(),
                qe = oe(Dt);
              {
                var m = (T) => {
                    var _ = Li(),
                      q = oe(_),
                      de = r(a(q), 2);
                    V(() => {
                      (e(n),
                        rr(() => {
                          e(g);
                        }));
                    });
                    var Ie = a(de);
                    Ie.value = Ie.__value = '';
                    var Me = r(Ie);
                    (bt(
                      Me,
                      1,
                      () => (
                        e(g),
                        s(() => e(g).fields.find((Pe) => Pe.name === 'method')?.options || [])
                      ),
                      ha,
                      (Pe, De) => {
                        var Be = he(),
                          Ce = oe(Be);
                        {
                          var mt = (Oe) => {
                              var Ne = Pi(),
                                nt = a(Ne, !0);
                              t(Ne);
                              var _t = {};
                              (V(() => {
                                (O(nt, (e(De), s(() => e(De).label))),
                                  _t !== (_t = (e(De), s(() => e(De).value))) &&
                                    (Ne.value =
                                      (Ne.__value = (e(De), s(() => e(De).value))) ?? ''));
                              }),
                                p(Oe, Ne));
                            },
                            ft = (Oe) => {
                              var Ne = Ri(),
                                nt = a(Ne, !0);
                              t(Ne);
                              var _t = {};
                              (V(() => {
                                (O(nt, e(De)),
                                  _t !== (_t = e(De)) && (Ne.value = (Ne.__value = e(De)) ?? ''));
                              }),
                                p(Oe, Ne));
                            };
                          S(Ce, (Oe) => {
                            (e(De),
                              s(() => typeof e(De) == 'object' && e(De).value)
                                ? Oe(mt)
                                : Oe(ft, !1));
                          });
                        }
                        p(Pe, Be);
                      }
                    ),
                      t(de),
                      t(q));
                    var je = r(q, 2),
                      Ue = a(je),
                      ot = r(a(Ue), 2);
                    (fe(ot), t(Ue));
                    var yt = r(Ue, 2),
                      tt = r(a(yt), 2);
                    (fe(tt), t(yt), t(je));
                    var Qe = r(je, 2),
                      et = a(Qe),
                      ut = r(a(et), 2);
                    (fe(ut), t(et));
                    var He = r(et, 2),
                      be = r(a(He), 2);
                    (fe(be), t(He), t(Qe));
                    var Le = r(Qe, 2),
                      We = a(Le),
                      xt = r(a(We), 2);
                    (fe(xt), t(We));
                    var x = r(We, 2),
                      pt = r(a(x), 2);
                    (fe(pt), t(x), t(Le));
                    var Fe = r(Le, 2),
                      lt = r(a(Fe), 2);
                    (fe(lt), t(Fe));
                    var Te = r(Fe, 2),
                      rt = r(a(Te), 2);
                    (Fa(rt),
                      t(Te),
                      nr(
                        de,
                        () => e(n).method,
                        (Pe) => Y(n, (e(n).method = Pe))
                      ),
                      me(
                        ot,
                        () => e(n).origin,
                        (Pe) => Y(n, (e(n).origin = Pe))
                      ),
                      me(
                        tt,
                        () => e(n).destination,
                        (Pe) => Y(n, (e(n).destination = Pe))
                      ),
                      me(
                        ut,
                        () => e(n).departureDate,
                        (Pe) => Y(n, (e(n).departureDate = Pe))
                      ),
                      me(
                        be,
                        () => e(n).departureTime,
                        (Pe) => Y(n, (e(n).departureTime = Pe))
                      ),
                      z('keyup', be, I),
                      me(
                        xt,
                        () => e(n).arrivalDate,
                        (Pe) => Y(n, (e(n).arrivalDate = Pe))
                      ),
                      me(
                        pt,
                        () => e(n).arrivalTime,
                        (Pe) => Y(n, (e(n).arrivalTime = Pe))
                      ),
                      z('keyup', pt, I),
                      me(
                        lt,
                        () => e(n).bookingReference,
                        (Pe) => Y(n, (e(n).bookingReference = Pe))
                      ),
                      me(
                        rt,
                        () => e(n).notes,
                        (Pe) => Y(n, (e(n).notes = Pe))
                      ),
                      p(T, _));
                  },
                  $ = (T) => {
                    var _ = he(),
                      q = oe(_);
                    {
                      var de = (Me) => {
                          var je = Fi(),
                            Ue = oe(je),
                            ot = a(Ue),
                            yt = r(a(ot), 2);
                          (fe(yt), t(ot));
                          var tt = r(ot, 2),
                            Qe = r(a(tt), 2);
                          (fe(Qe), t(tt), t(Ue));
                          var et = r(Ue, 2),
                            ut = a(et),
                            He = r(a(ut), 2);
                          (fe(He), t(ut));
                          var be = r(ut, 2),
                            Le = r(a(be), 2);
                          (fe(Le), t(be), t(et));
                          var We = r(et, 2),
                            xt = r(a(We), 2);
                          (fe(xt), t(We));
                          var x = r(We, 2),
                            pt = a(x),
                            Fe = r(a(pt), 2);
                          (fe(Fe), t(pt));
                          var lt = r(pt, 2),
                            Te = r(a(lt), 2);
                          (fe(Te), t(lt), t(x));
                          var rt = r(x, 2),
                            Pe = r(a(rt), 2);
                          (fe(Pe), t(rt));
                          var De = r(rt, 2),
                            Be = r(a(De), 2);
                          (Fa(Be),
                            t(De),
                            me(
                              yt,
                              () => e(n).company,
                              (Ce) => Y(n, (e(n).company = Ce))
                            ),
                            me(
                              Qe,
                              () => e(n).pickupLocation,
                              (Ce) => Y(n, (e(n).pickupLocation = Ce))
                            ),
                            me(
                              He,
                              () => e(n).pickupDate,
                              (Ce) => Y(n, (e(n).pickupDate = Ce))
                            ),
                            me(
                              Le,
                              () => e(n).pickupTime,
                              (Ce) => Y(n, (e(n).pickupTime = Ce))
                            ),
                            z('keyup', Le, I),
                            me(
                              xt,
                              () => e(n).dropoffLocation,
                              (Ce) => Y(n, (e(n).dropoffLocation = Ce))
                            ),
                            me(
                              Fe,
                              () => e(n).dropoffDate,
                              (Ce) => Y(n, (e(n).dropoffDate = Ce))
                            ),
                            me(
                              Te,
                              () => e(n).dropoffTime,
                              (Ce) => Y(n, (e(n).dropoffTime = Ce))
                            ),
                            z('keyup', Te, I),
                            me(
                              Pe,
                              () => e(n).confirmationNumber,
                              (Ce) => Y(n, (e(n).confirmationNumber = Ce))
                            ),
                            me(
                              Be,
                              () => e(n).notes,
                              (Ce) => Y(n, (e(n).notes = Ce))
                            ),
                            p(Me, je));
                        },
                        Ie = (Me) => {
                          var je = he(),
                            Ue = oe(je);
                          {
                            var ot = (tt) => {
                                var Qe = Ui(),
                                  et = oe(Qe),
                                  ut = r(a(et), 2);
                                (fe(ut), t(et));
                                var He = r(et, 2),
                                  be = r(a(He), 2);
                                (fe(be), t(He));
                                var Le = r(He, 2),
                                  We = a(Le),
                                  xt = a(We);
                                (fe(xt), Wt(2), t(We), t(Le));
                                var x = r(Le, 2);
                                {
                                  var pt = (Ce) => {
                                      var mt = Oi(),
                                        ft = a(mt),
                                        Oe = r(a(ft), 2);
                                      (fe(Oe), t(ft));
                                      var Ne = r(ft, 2),
                                        nt = r(a(Ne), 2);
                                      (fe(nt),
                                        t(Ne),
                                        t(mt),
                                        me(
                                          Oe,
                                          () => e(n).startDate,
                                          (_t) => Y(n, (e(n).startDate = _t))
                                        ),
                                        me(
                                          nt,
                                          () => e(n).endDate,
                                          (_t) => Y(n, (e(n).endDate = _t))
                                        ),
                                        p(Ce, mt));
                                    },
                                    Fe = (Ce) => {
                                      var mt = zi(),
                                        ft = oe(mt),
                                        Oe = a(ft),
                                        Ne = r(a(Oe), 2);
                                      (fe(Ne), t(Oe));
                                      var nt = r(Oe, 2),
                                        _t = r(a(nt), 2);
                                      (fe(_t), t(nt), t(ft));
                                      var St = r(ft, 2),
                                        Ee = a(St),
                                        dt = r(a(Ee), 2);
                                      (fe(dt), t(Ee));
                                      var qt = r(Ee, 2),
                                        Ut = r(a(qt), 2);
                                      (fe(Ut),
                                        t(qt),
                                        t(St),
                                        me(
                                          Ne,
                                          () => e(n).startDate,
                                          (at) => Y(n, (e(n).startDate = at))
                                        ),
                                        me(
                                          _t,
                                          () => e(n).startTime,
                                          (at) => Y(n, (e(n).startTime = at))
                                        ),
                                        z('keyup', _t, I),
                                        me(
                                          dt,
                                          () => e(n).endDate,
                                          (at) => Y(n, (e(n).endDate = at))
                                        ),
                                        me(
                                          Ut,
                                          () => e(n).endTime,
                                          (at) => Y(n, (e(n).endTime = at))
                                        ),
                                        z('keyup', Ut, I),
                                        p(Ce, mt));
                                    };
                                  S(x, (Ce) => {
                                    (e(n), s(() => e(n).allDay) ? Ce(pt) : Ce(Fe, !1));
                                  });
                                }
                                var lt = r(x, 2),
                                  Te = r(a(lt), 2);
                                (fe(Te), t(lt));
                                var rt = r(lt, 2),
                                  Pe = r(a(rt), 2);
                                (Fa(Pe), t(rt));
                                var De = r(rt, 2),
                                  Be = r(a(De), 2);
                                (Fa(Be),
                                  t(De),
                                  me(
                                    ut,
                                    () => e(n).name,
                                    (Ce) => Y(n, (e(n).name = Ce))
                                  ),
                                  me(
                                    be,
                                    () => e(n).location,
                                    (Ce) => Y(n, (e(n).location = Ce))
                                  ),
                                  nn(
                                    xt,
                                    () => e(n).allDay,
                                    (Ce) => Y(n, (e(n).allDay = Ce))
                                  ),
                                  me(
                                    Te,
                                    () => e(n).ticketNumber,
                                    (Ce) => Y(n, (e(n).ticketNumber = Ce))
                                  ),
                                  me(
                                    Pe,
                                    () => e(n).description,
                                    (Ce) => Y(n, (e(n).description = Ce))
                                  ),
                                  me(
                                    Be,
                                    () => e(n).notes,
                                    (Ce) => Y(n, (e(n).notes = Ce))
                                  ),
                                  p(tt, Qe));
                              },
                              yt = (tt) => {
                                var Qe = he(),
                                  et = oe(Qe);
                                {
                                  var ut = (be) => {
                                      var Le = he(),
                                        We = oe(Le);
                                      (bt(
                                        We,
                                        1,
                                        () => (e(g), s(() => e(g).fields)),
                                        ha,
                                        (xt, x) => {
                                          var pt = he(),
                                            Fe = oe(pt);
                                          {
                                            var lt = (rt) => {
                                                var Pe = Bi(),
                                                  De = a(Pe),
                                                  Be = a(De),
                                                  Ce = a(Be, !0);
                                                t(Be);
                                                var mt = r(Be, 2);
                                                (fe(mt), t(De));
                                                var ft = r(De, 2);
                                                {
                                                  var Oe = (Ne) => {
                                                    var nt = he(),
                                                      _t = oe(nt);
                                                    (bt(
                                                      _t,
                                                      1,
                                                      () => (e(g), s(() => e(g).fields)),
                                                      ha,
                                                      (St, Ee) => {
                                                        var dt = he(),
                                                          qt = oe(dt);
                                                        {
                                                          var Ut = (at) => {
                                                            var D = Hi(),
                                                              wt = a(D),
                                                              Ke = a(wt, !0);
                                                            t(wt);
                                                            var it = r(wt, 2);
                                                            (fe(it),
                                                              t(D),
                                                              V(() => {
                                                                (Ye(
                                                                  wt,
                                                                  'for',
                                                                  (e(Ee), s(() => e(Ee).name))
                                                                ),
                                                                  O(
                                                                    Ke,
                                                                    (e(Ee), s(() => e(Ee).label))
                                                                  ),
                                                                  Ye(
                                                                    it,
                                                                    'id',
                                                                    (e(Ee), s(() => e(Ee).name))
                                                                  ),
                                                                  Ye(
                                                                    it,
                                                                    'name',
                                                                    (e(Ee), s(() => e(Ee).name))
                                                                  ),
                                                                  (it.required =
                                                                    (e(Ee),
                                                                    s(() => e(Ee).required))));
                                                              }),
                                                              me(
                                                                it,
                                                                () => e(n)[e(Ee).name],
                                                                (ht) =>
                                                                  Y(n, (e(n)[e(Ee).name] = ht))
                                                              ),
                                                              p(at, D));
                                                          };
                                                          S(qt, (at) => {
                                                            (e(Ee),
                                                              s(
                                                                () => e(Ee).name === 'returnDate'
                                                              ) && at(Ut));
                                                          });
                                                        }
                                                        p(St, dt);
                                                      }
                                                    ),
                                                      p(Ne, nt));
                                                  };
                                                  S(ft, (Ne) => {
                                                    (e(g),
                                                      s(() =>
                                                        e(g).fields.some(
                                                          (nt) => nt.name === 'returnDate'
                                                        )
                                                      ) && Ne(Oe));
                                                  });
                                                }
                                                (t(Pe),
                                                  V(() => {
                                                    (Ye(Be, 'for', (e(x), s(() => e(x).name))),
                                                      O(Ce, (e(x), s(() => e(x).label))),
                                                      Ye(mt, 'id', (e(x), s(() => e(x).name))),
                                                      Ye(mt, 'name', (e(x), s(() => e(x).name))),
                                                      (mt.required =
                                                        (e(x), s(() => e(x).required))));
                                                  }),
                                                  me(
                                                    mt,
                                                    () => e(n)[e(x).name],
                                                    (Ne) => Y(n, (e(n)[e(x).name] = Ne))
                                                  ),
                                                  p(rt, Pe));
                                              },
                                              Te = (rt) => {
                                                var Pe = he(),
                                                  De = oe(Pe);
                                                {
                                                  var Be = (Ce) => {
                                                    var mt = Xi(),
                                                      ft = a(mt),
                                                      Oe = a(ft, !0);
                                                    t(ft);
                                                    var Ne = r(ft, 2);
                                                    {
                                                      var nt = (St) => {
                                                          var Ee = Vi();
                                                          (fe(Ee),
                                                            V(() => {
                                                              (Ye(
                                                                Ee,
                                                                'id',
                                                                (e(x), s(() => e(x).name))
                                                              ),
                                                                Ye(
                                                                  Ee,
                                                                  'name',
                                                                  (e(x), s(() => e(x).name))
                                                                ),
                                                                Ye(
                                                                  Ee,
                                                                  'placeholder',
                                                                  (e(x), s(() => e(x).placeholder))
                                                                ),
                                                                (Ee.required =
                                                                  (e(x), s(() => e(x).required))),
                                                                (Ee.readOnly =
                                                                  (e(x), s(() => e(x).readonly))),
                                                                Pt(
                                                                  Ee,
                                                                  1,
                                                                  Vr(
                                                                    (e(x),
                                                                    s(() =>
                                                                      e(x).readonly
                                                                        ? 'readonly'
                                                                        : ''
                                                                    ))
                                                                  )
                                                                ));
                                                            }),
                                                            me(
                                                              Ee,
                                                              () => e(n)[e(x).name],
                                                              (dt) => Y(n, (e(n)[e(x).name] = dt))
                                                            ),
                                                            p(St, Ee));
                                                        },
                                                        _t = (St) => {
                                                          var Ee = he(),
                                                            dt = oe(Ee);
                                                          {
                                                            var qt = (at) => {
                                                                var D = Ji();
                                                                (fe(D),
                                                                  V(() => {
                                                                    (Ye(
                                                                      D,
                                                                      'id',
                                                                      (e(x), s(() => e(x).name))
                                                                    ),
                                                                      Ye(
                                                                        D,
                                                                        'name',
                                                                        (e(x), s(() => e(x).name))
                                                                      ),
                                                                      (D.required =
                                                                        (e(x),
                                                                        s(() => e(x).required))));
                                                                  }),
                                                                  me(
                                                                    D,
                                                                    () => e(n)[e(x).name],
                                                                    (wt) =>
                                                                      Y(n, (e(n)[e(x).name] = wt))
                                                                  ),
                                                                  p(at, D));
                                                              },
                                                              Ut = (at) => {
                                                                var D = he(),
                                                                  wt = oe(D);
                                                                {
                                                                  var Ke = (ht) => {
                                                                      var Re = Gi();
                                                                      (fe(Re),
                                                                        V(() => {
                                                                          (Ye(
                                                                            Re,
                                                                            'id',
                                                                            (e(x),
                                                                            s(() => e(x).name))
                                                                          ),
                                                                            Ye(
                                                                              Re,
                                                                              'name',
                                                                              (e(x),
                                                                              s(() => e(x).name))
                                                                            ),
                                                                            Ye(
                                                                              Re,
                                                                              'placeholder',
                                                                              (e(x),
                                                                              s(
                                                                                () =>
                                                                                  e(x).placeholder
                                                                              ))
                                                                            ));
                                                                        }),
                                                                        me(
                                                                          Re,
                                                                          () => e(n)[e(x).name],
                                                                          (ct) =>
                                                                            Y(
                                                                              n,
                                                                              (e(n)[e(x).name] = ct)
                                                                            )
                                                                        ),
                                                                        z('keyup', Re, I),
                                                                        p(ht, Re));
                                                                    },
                                                                    it = (ht) => {
                                                                      var Re = he(),
                                                                        ct = oe(Re);
                                                                      {
                                                                        var Ct = (Ht) => {
                                                                            var Vt = Zi();
                                                                            V(() => {
                                                                              (e(n),
                                                                                rr(() => {
                                                                                  e(x);
                                                                                }));
                                                                            });
                                                                            var ba = a(Vt),
                                                                              $a = a(ba);
                                                                            (t(ba),
                                                                              (ba.value =
                                                                                ba.__value =
                                                                                  ''));
                                                                            var Da = r(ba);
                                                                            (bt(
                                                                              Da,
                                                                              1,
                                                                              () => (
                                                                                e(x),
                                                                                s(
                                                                                  () => e(x).options
                                                                                )
                                                                              ),
                                                                              ha,
                                                                              (ra, Gt) => {
                                                                                var Ya = he(),
                                                                                  Wa = oe(Ya);
                                                                                {
                                                                                  var or = (Sa) => {
                                                                                      var na = Yi(),
                                                                                        kt = a(
                                                                                          na,
                                                                                          !0
                                                                                        );
                                                                                      t(na);
                                                                                      var It = {};
                                                                                      (V(() => {
                                                                                        (O(
                                                                                          kt,
                                                                                          (e(Gt),
                                                                                          s(
                                                                                            () =>
                                                                                              e(Gt)
                                                                                                .label
                                                                                          ))
                                                                                        ),
                                                                                          It !==
                                                                                            (It =
                                                                                              (e(
                                                                                                Gt
                                                                                              ),
                                                                                              s(
                                                                                                () =>
                                                                                                  e(
                                                                                                    Gt
                                                                                                  )
                                                                                                    .value
                                                                                              ))) &&
                                                                                            (na.value =
                                                                                              (na.__value =
                                                                                                (e(
                                                                                                  Gt
                                                                                                ),
                                                                                                s(
                                                                                                  () =>
                                                                                                    e(
                                                                                                      Gt
                                                                                                    )
                                                                                                      .value
                                                                                                ))) ??
                                                                                              ''));
                                                                                      }),
                                                                                        p(Sa, na));
                                                                                    },
                                                                                    lr = (Sa) => {
                                                                                      var na = Wi(),
                                                                                        kt = a(
                                                                                          na,
                                                                                          !0
                                                                                        );
                                                                                      t(na);
                                                                                      var It = {};
                                                                                      (V(() => {
                                                                                        (O(
                                                                                          kt,
                                                                                          e(Gt)
                                                                                        ),
                                                                                          It !==
                                                                                            (It =
                                                                                              e(
                                                                                                Gt
                                                                                              )) &&
                                                                                            (na.value =
                                                                                              (na.__value =
                                                                                                e(
                                                                                                  Gt
                                                                                                )) ??
                                                                                              ''));
                                                                                      }),
                                                                                        p(Sa, na));
                                                                                    };
                                                                                  S(Wa, (Sa) => {
                                                                                    (e(Gt),
                                                                                      s(
                                                                                        () =>
                                                                                          typeof e(
                                                                                            Gt
                                                                                          ) ==
                                                                                            'object' &&
                                                                                          e(Gt)
                                                                                            .value
                                                                                      )
                                                                                        ? Sa(or)
                                                                                        : Sa(
                                                                                            lr,
                                                                                            !1
                                                                                          ));
                                                                                  });
                                                                                }
                                                                                p(ra, Ya);
                                                                              }
                                                                            ),
                                                                              t(Vt),
                                                                              V(() => {
                                                                                (Ye(
                                                                                  Vt,
                                                                                  'id',
                                                                                  (e(x),
                                                                                  s(
                                                                                    () => e(x).name
                                                                                  ))
                                                                                ),
                                                                                  Ye(
                                                                                    Vt,
                                                                                    'name',
                                                                                    (e(x),
                                                                                    s(
                                                                                      () =>
                                                                                        e(x).name
                                                                                    ))
                                                                                  ),
                                                                                  (Vt.required =
                                                                                    (e(x),
                                                                                    s(
                                                                                      () =>
                                                                                        e(x)
                                                                                          .required
                                                                                    ))),
                                                                                  O(
                                                                                    $a,
                                                                                    `Select ${(e(x), s(() => e(x).label) ?? '')}`
                                                                                  ));
                                                                              }),
                                                                              nr(
                                                                                Vt,
                                                                                () =>
                                                                                  e(n)[e(x).name],
                                                                                (ra) =>
                                                                                  Y(
                                                                                    n,
                                                                                    (e(n)[
                                                                                      e(x).name
                                                                                    ] = ra)
                                                                                  )
                                                                              ),
                                                                              p(Ht, Vt));
                                                                          },
                                                                          Bt = (Ht) => {
                                                                            var Vt = he(),
                                                                              ba = oe(Vt);
                                                                            {
                                                                              var $a = (Da) => {
                                                                                var ra = Ki();
                                                                                (Fa(ra),
                                                                                  V(() => {
                                                                                    (Ye(
                                                                                      ra,
                                                                                      'id',
                                                                                      (e(x),
                                                                                      s(
                                                                                        () =>
                                                                                          e(x).name
                                                                                      ))
                                                                                    ),
                                                                                      Ye(
                                                                                        ra,
                                                                                        'name',
                                                                                        (e(x),
                                                                                        s(
                                                                                          () =>
                                                                                            e(x)
                                                                                              .name
                                                                                        ))
                                                                                      ),
                                                                                      Ye(
                                                                                        ra,
                                                                                        'placeholder',
                                                                                        (e(x),
                                                                                        s(
                                                                                          () =>
                                                                                            e(x)
                                                                                              .placeholder
                                                                                        ))
                                                                                      ));
                                                                                  }),
                                                                                  me(
                                                                                    ra,
                                                                                    () =>
                                                                                      e(n)[
                                                                                        e(x).name
                                                                                      ],
                                                                                    (Gt) =>
                                                                                      Y(
                                                                                        n,
                                                                                        (e(n)[
                                                                                          e(x).name
                                                                                        ] = Gt)
                                                                                      )
                                                                                  ),
                                                                                  p(Da, ra));
                                                                              };
                                                                              S(
                                                                                ba,
                                                                                (Da) => {
                                                                                  (e(x),
                                                                                    s(
                                                                                      () =>
                                                                                        e(x)
                                                                                          .type ===
                                                                                        'textarea'
                                                                                    ) && Da($a));
                                                                                },
                                                                                !0
                                                                              );
                                                                            }
                                                                            p(Ht, Vt);
                                                                          };
                                                                        S(
                                                                          ct,
                                                                          (Ht) => {
                                                                            (e(x),
                                                                              s(
                                                                                () =>
                                                                                  e(x).type ===
                                                                                  'select'
                                                                              )
                                                                                ? Ht(Ct)
                                                                                : Ht(Bt, !1));
                                                                          },
                                                                          !0
                                                                        );
                                                                      }
                                                                      p(ht, Re);
                                                                    };
                                                                  S(
                                                                    wt,
                                                                    (ht) => {
                                                                      (e(x),
                                                                        s(
                                                                          () => e(x).type === 'time'
                                                                        )
                                                                          ? ht(Ke)
                                                                          : ht(it, !1));
                                                                    },
                                                                    !0
                                                                  );
                                                                }
                                                                p(at, D);
                                                              };
                                                            S(
                                                              dt,
                                                              (at) => {
                                                                (e(x),
                                                                  s(() => e(x).type === 'date')
                                                                    ? at(qt)
                                                                    : at(Ut, !1));
                                                              },
                                                              !0
                                                            );
                                                          }
                                                          p(St, Ee);
                                                        };
                                                      S(Ne, (St) => {
                                                        (e(x),
                                                          s(() => e(x).type === 'text')
                                                            ? St(nt)
                                                            : St(_t, !1));
                                                      });
                                                    }
                                                    (t(mt),
                                                      V(() => {
                                                        (Ye(ft, 'for', (e(x), s(() => e(x).name))),
                                                          O(Oe, (e(x), s(() => e(x).label))));
                                                      }),
                                                      p(Ce, mt));
                                                  };
                                                  S(
                                                    De,
                                                    (Ce) => {
                                                      (e(x),
                                                        s(() => e(x).name !== 'returnDate') &&
                                                          Ce(Be));
                                                    },
                                                    !0
                                                  );
                                                }
                                                p(rt, Pe);
                                              };
                                            S(Fe, (rt) => {
                                              (e(x),
                                                s(() => e(x).name === 'departureDate')
                                                  ? rt(lt)
                                                  : rt(Te, !1));
                                            });
                                          }
                                          p(xt, pt);
                                        }
                                      ),
                                        p(be, Le));
                                    },
                                    He = (be) => {
                                      var Le = he(),
                                        We = oe(Le);
                                      (bt(
                                        We,
                                        1,
                                        () => (e(g), s(() => e(g).fields)),
                                        ha,
                                        (xt, x) => {
                                          var pt = is(),
                                            Fe = a(pt),
                                            lt = a(Fe, !0);
                                          t(Fe);
                                          var Te = r(Fe, 2);
                                          {
                                            var rt = (De) => {
                                                var Be = Qi();
                                                (fe(Be),
                                                  V(() => {
                                                    (Ye(Be, 'id', (e(x), s(() => e(x).name))),
                                                      Ye(Be, 'name', (e(x), s(() => e(x).name))),
                                                      Ye(
                                                        Be,
                                                        'placeholder',
                                                        (e(x), s(() => e(x).placeholder))
                                                      ),
                                                      (Be.required =
                                                        (e(x), s(() => e(x).required))),
                                                      (Be.readOnly =
                                                        (e(x), s(() => e(x).readonly))),
                                                      Pt(
                                                        Be,
                                                        1,
                                                        Vr(
                                                          (e(x),
                                                          s(() =>
                                                            e(x).readonly ? 'readonly' : ''
                                                          ))
                                                        )
                                                      ));
                                                  }),
                                                  me(
                                                    Be,
                                                    () => e(n)[e(x).name],
                                                    (Ce) => Y(n, (e(n)[e(x).name] = Ce))
                                                  ),
                                                  p(De, Be));
                                              },
                                              Pe = (De) => {
                                                var Be = he(),
                                                  Ce = oe(Be);
                                                {
                                                  var mt = (Oe) => {
                                                      var Ne = es();
                                                      (fe(Ne),
                                                        V(() => {
                                                          (Ye(Ne, 'id', (e(x), s(() => e(x).name))),
                                                            Ye(
                                                              Ne,
                                                              'name',
                                                              (e(x), s(() => e(x).name))
                                                            ),
                                                            (Ne.required =
                                                              (e(x), s(() => e(x).required))));
                                                        }),
                                                        me(
                                                          Ne,
                                                          () => e(n)[e(x).name],
                                                          (nt) => Y(n, (e(n)[e(x).name] = nt))
                                                        ),
                                                        p(Oe, Ne));
                                                    },
                                                    ft = (Oe) => {
                                                      var Ne = he(),
                                                        nt = oe(Ne);
                                                      {
                                                        var _t = (Ee) => {
                                                            var dt = ts();
                                                            (fe(dt),
                                                              V(() => {
                                                                (Ye(
                                                                  dt,
                                                                  'id',
                                                                  (e(x), s(() => e(x).name))
                                                                ),
                                                                  Ye(
                                                                    dt,
                                                                    'name',
                                                                    (e(x), s(() => e(x).name))
                                                                  ),
                                                                  Ye(
                                                                    dt,
                                                                    'placeholder',
                                                                    (e(x),
                                                                    s(() => e(x).placeholder))
                                                                  ));
                                                              }),
                                                              me(
                                                                dt,
                                                                () => e(n)[e(x).name],
                                                                (qt) => Y(n, (e(n)[e(x).name] = qt))
                                                              ),
                                                              z('keyup', dt, I),
                                                              p(Ee, dt));
                                                          },
                                                          St = (Ee) => {
                                                            var dt = he(),
                                                              qt = oe(dt);
                                                            {
                                                              var Ut = (D) => {
                                                                  var wt = rs();
                                                                  V(() => {
                                                                    (e(n),
                                                                      rr(() => {
                                                                        e(x);
                                                                      }));
                                                                  });
                                                                  var Ke = a(wt),
                                                                    it = a(Ke);
                                                                  (t(Ke),
                                                                    (Ke.value = Ke.__value = ''));
                                                                  var ht = r(Ke);
                                                                  (bt(
                                                                    ht,
                                                                    1,
                                                                    () => (
                                                                      e(x),
                                                                      s(() => e(x).options)
                                                                    ),
                                                                    ha,
                                                                    (Re, ct) => {
                                                                      var Ct = as(),
                                                                        Bt = a(Ct, !0);
                                                                      t(Ct);
                                                                      var Ht = {};
                                                                      (V(() => {
                                                                        (O(Bt, e(ct)),
                                                                          Ht !== (Ht = e(ct)) &&
                                                                            (Ct.value =
                                                                              (Ct.__value =
                                                                                e(ct)) ?? ''));
                                                                      }),
                                                                        p(Re, Ct));
                                                                    }
                                                                  ),
                                                                    t(wt),
                                                                    V(() => {
                                                                      (Ye(
                                                                        wt,
                                                                        'id',
                                                                        (e(x), s(() => e(x).name))
                                                                      ),
                                                                        Ye(
                                                                          wt,
                                                                          'name',
                                                                          (e(x), s(() => e(x).name))
                                                                        ),
                                                                        (wt.required =
                                                                          (e(x),
                                                                          s(() => e(x).required))),
                                                                        O(
                                                                          it,
                                                                          `Select ${(e(x), s(() => e(x).label) ?? '')}`
                                                                        ));
                                                                    }),
                                                                    nr(
                                                                      wt,
                                                                      () => e(n)[e(x).name],
                                                                      (Re) =>
                                                                        Y(n, (e(n)[e(x).name] = Re))
                                                                    ),
                                                                    p(D, wt));
                                                                },
                                                                at = (D) => {
                                                                  var wt = he(),
                                                                    Ke = oe(wt);
                                                                  {
                                                                    var it = (ht) => {
                                                                      var Re = ns();
                                                                      (Fa(Re),
                                                                        V(() => {
                                                                          (Ye(
                                                                            Re,
                                                                            'id',
                                                                            (e(x),
                                                                            s(() => e(x).name))
                                                                          ),
                                                                            Ye(
                                                                              Re,
                                                                              'name',
                                                                              (e(x),
                                                                              s(() => e(x).name))
                                                                            ),
                                                                            Ye(
                                                                              Re,
                                                                              'placeholder',
                                                                              (e(x),
                                                                              s(
                                                                                () =>
                                                                                  e(x).placeholder
                                                                              ))
                                                                            ));
                                                                        }),
                                                                        me(
                                                                          Re,
                                                                          () => e(n)[e(x).name],
                                                                          (ct) =>
                                                                            Y(
                                                                              n,
                                                                              (e(n)[e(x).name] = ct)
                                                                            )
                                                                        ),
                                                                        p(ht, Re));
                                                                    };
                                                                    S(
                                                                      Ke,
                                                                      (ht) => {
                                                                        (e(x),
                                                                          s(
                                                                            () =>
                                                                              e(x).type ===
                                                                              'textarea'
                                                                          ) && ht(it));
                                                                      },
                                                                      !0
                                                                    );
                                                                  }
                                                                  p(D, wt);
                                                                };
                                                              S(
                                                                qt,
                                                                (D) => {
                                                                  (e(x),
                                                                    s(() => e(x).type === 'select')
                                                                      ? D(Ut)
                                                                      : D(at, !1));
                                                                },
                                                                !0
                                                              );
                                                            }
                                                            p(Ee, dt);
                                                          };
                                                        S(
                                                          nt,
                                                          (Ee) => {
                                                            (e(x),
                                                              s(() => e(x).type === 'time')
                                                                ? Ee(_t)
                                                                : Ee(St, !1));
                                                          },
                                                          !0
                                                        );
                                                      }
                                                      p(Oe, Ne);
                                                    };
                                                  S(
                                                    Ce,
                                                    (Oe) => {
                                                      (e(x),
                                                        s(() => e(x).type === 'date')
                                                          ? Oe(mt)
                                                          : Oe(ft, !1));
                                                    },
                                                    !0
                                                  );
                                                }
                                                p(De, Be);
                                              };
                                            S(Te, (De) => {
                                              (e(x),
                                                s(() => e(x).type === 'text')
                                                  ? De(rt)
                                                  : De(Pe, !1));
                                            });
                                          }
                                          (t(pt),
                                            V(() => {
                                              (Ye(Fe, 'for', (e(x), s(() => e(x).name))),
                                                O(lt, (e(x), s(() => e(x).label))));
                                            }),
                                            p(xt, pt));
                                        }
                                      ),
                                        p(be, Le));
                                    };
                                  S(et, (be) => {
                                    (Se(u()),
                                      e(g),
                                      s(
                                        () =>
                                          u() === 'trip' &&
                                          e(g).fields.some((Le) => Le.name === 'departureDate')
                                      )
                                        ? be(ut)
                                        : be(He, !1));
                                  });
                                }
                                p(tt, Qe);
                              };
                            S(
                              Ue,
                              (tt) => {
                                u() === 'event' ? tt(ot) : tt(yt, !1);
                              },
                              !0
                            );
                          }
                          p(Me, je);
                        };
                      S(
                        q,
                        (Me) => {
                          u() === 'carRental' ? Me(de) : Me(Ie, !1);
                        },
                        !0
                      );
                    }
                    p(T, _);
                  };
                S(
                  qe,
                  (T) => {
                    u() === 'transportation' ? T(m) : T($, !1);
                  },
                  !0
                );
              }
              p(Ge, Dt);
            };
          S(
            ae,
            (Ge) => {
              u() === 'hotel' ? Ge(ke) : Ge(ze, !1);
            },
            !0
          );
        }
        p(N, ee);
      };
    S(B, (N) => {
      u() === 'flight' ? N(Z) : N(G, !1);
    });
  }
  t(re);
  var U = r(re, 2);
  {
    var pe = (N) => {
      var ee = ss(),
        ae = a(ee);
      (bi(ae, {
        get companions() {
          return e(ye);
        },
        onCompanionsUpdate: (ke) => {
          if (
            (console.log('[ItemEditForm] onCompanionsUpdate called:', {
              oldCount: e(ye).length,
              newCount: ke.length,
              companions: ke,
              isEditing: e(c),
              itemId: v()?.id,
              selectedTripId: e(le),
            }),
            l(ye, ke),
            e(c) && v()?.id && e(le))
          ) {
            const ze = ke.map((Ge) => Ge.id);
            (console.log('[ItemEditForm] Saving companions to API:', {
              itemType: u(),
              itemId: v().id,
              companionIds: ze,
            }),
              qr.update(u(), v().id, ze).catch((Ge) => {
                console.error('Error saving companions:', Ge);
              }));
          } else if (e(c) && v()?.id && !e(le)) {
            const ze = ke.map((Ge) => Ge.id);
            (console.log('[ItemEditForm] Saving companions to API (standalone):', {
              itemType: u(),
              itemId: v().id,
              companionIds: ze,
            }),
              qr.update(u(), v().id, ze).catch((Ge) => {
                console.error('Error saving companions:', Ge);
              }));
          }
        },
        onAddCompanion: null,
        onRemoveCompanion: null,
      }),
        t(ee),
        p(N, ee));
    };
    S(U, (N) => {
      e(f) && N(pe);
    });
  }
  var $e = r(U, 2);
  {
    var Ve = (N) => {
      {
        let ee = vt(() => (Se(v()), s(() => v().tripCompanions || [])));
        Ni(N, {
          get tripId() {
            return (Se(v()), s(() => v().id));
          },
          get companions() {
            return e(ee);
          },
          onCompanionsUpdate: (ae) => {
            (console.log('[ItemEditForm] Trip companions updated:', {
              oldCount: v().tripCompanions?.length || 0,
              newCount: ae.length,
              companions: ae,
            }),
              v() &&
                (v((v().tripCompanions = ae), !0),
                console.log('[ItemEditForm] data.tripCompanions updated to:', v().tripCompanions)));
          },
        });
      }
    };
    S($e, (N) => {
      (Se(u()), e(c), Se(v()), s(() => u() === 'trip' && e(c) && v()?.id) && N(Ve));
    });
  }
  var Et = r($e, 2),
    Xe = a(Et),
    st = a(Xe, !0);
  t(Xe);
  var Je = r(Xe, 2);
  t(Et);
  var Nt = r(Et, 2);
  {
    var Mt = (N) => {
      var ee = os();
      (V(() => (ee.disabled = e(te))), z('click', ee, F), p(N, ee));
    };
    S(Nt, (N) => {
      e(c) && N(Mt);
    });
  }
  (t(b),
    t(j),
    V(
      (N) => {
        (O(E, (e(g), s(() => e(g).title))),
          Ye(M, 'data-type', u()),
          O(d, N),
          (Xe.disabled = e(te)),
          O(st, e(c) ? 'Update' : 'Add'),
          (Je.disabled = e(te)));
      },
      [() => (Se(u()), s(() => J(u())))]
    ),
    z('click', y, function (...N) {
      L()?.apply(this, N);
    }),
    z('click', Je, function (...N) {
      L()?.apply(this, N);
    }),
    z('submit', b, xr(xe)),
    p(i, j),
    ta());
}
var cs = w('<span class="material-symbols-outlined"> </span>'),
  vs = w(
    '<div class="flight-info svelte-1qvkaye"><div class="flight-line svelte-1qvkaye"> </div> <div class="flight-line svelte-1qvkaye"> </div></div>'
  ),
  us = w('<span class="item-label svelte-1qvkaye"> </span>'),
  ps = w('<div role="button" tabindex="0"><!> <!></div>'),
  ms = w('<span class="day-number svelte-1qvkaye"> </span>'),
  fs = w('<div><!></div>'),
  hs = w(
    '<div class="month-row svelte-1qvkaye"><div class="month-label svelte-1qvkaye"><div class="month-name svelte-1qvkaye"> </div> <div class="year svelte-1qvkaye"> </div></div> <div class="days-grid svelte-1qvkaye"><div class="items-layer svelte-1qvkaye"></div> <!></div></div>'
  ),
  gs = w(
    '<div class="calendar-container svelte-1qvkaye"><div class="calendar-grid svelte-1qvkaye"></div></div>'
  );
function _s(i, o) {
  ea(o, !1);
  let c = Ae(o, 'trips', 24, () => []),
    f = Ae(o, 'standaloneItems', 24, () => ({
      flights: [],
      hotels: [],
      transportation: [],
      carRentals: [],
      events: [],
    })),
    C = Ae(o, 'onItemClick', 8, () => {});
  const g = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    u = {
      trip: '#28536b',
      flight: '#d4a823',
      hotel: '#9b6db3',
      event: '#d6389f',
      transportation: '#2b7ab6',
      carRental: '#d97a2f',
    };
  let v = ne([]),
    h = {},
    R = ne({}),
    L = new Date();
  const ue = new Set([
    '2026-01-01',
    '2026-01-19',
    '2026-05-25',
    '2026-06-19',
    '2026-07-03',
    '2026-09-07',
    '2026-11-26',
    '2026-11-27',
    '2026-12-24',
    '2026-12-25',
    '2026-12-28',
    '2026-12-29',
    '2026-12-30',
    '2026-12-31',
  ]);
  function te(F) {
    return F ? ue.has(F) : !1;
  }
  function ve(F) {
    const j = F.getUTCFullYear(),
      K = String(F.getUTCMonth() + 1).padStart(2, '0'),
      X = String(F.getUTCDate()).padStart(2, '0');
    return `${j}-${K}-${X}`;
  }
  function we(F) {
    const [j, K, X] = F.split('-').map(Number);
    return new Date(j, K - 1, X, 0, 0, 0, 0);
  }
  function _e(F) {
    const j = new Date(F);
    return (j.setHours(0, 0, 0, 0), j);
  }
  function n() {
    ((L = new Date()), L.setHours(0, 0, 0, 0), (h = {}));
    const F = new Date(L);
    (F.setMonth(L.getMonth() - 3), F.setDate(1));
    const j = new Date(L);
    (j.setMonth(L.getMonth() + 15), j.setDate(1));
    function K(y, Q) {
      (h[y] || (h[y] = []), h[y].some((E) => E.id === Q.id) || h[y].push(Q));
    }
    function X(y) {
      const Q = ve(y.startDate);
      K(Q, y);
      let E = new Date(y.startDate);
      for (E.setMonth(E.getMonth() + 1), E.setDate(1); E <= y.endDate; ) {
        const M = ve(E);
        (K(M, y), E.setMonth(E.getMonth() + 1));
      }
    }
    (c().forEach((y) => {
      if (!y.departureDate || !y.returnDate) return;
      const Q = we(y.departureDate),
        E = we(y.returnDate),
        M = Math.ceil((E.getTime() - Q.getTime()) / (1e3 * 60 * 60 * 24)) + 1,
        P = { id: y.id, type: 'trip', data: y, startDate: Q, endDate: E, durationDays: M };
      (X(P),
        y.flights &&
          y.flights.forEach((d) => {
            if (!d.departureDateTime) return;
            let b = new Date(d.departureDateTime);
            b.setHours(0, 0, 0, 0);
            let k = new Date(d.arrivalDateTime || d.departureDateTime);
            k.setHours(0, 0, 0, 0);
            const W = Math.ceil((k.getTime() - b.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
            X({ id: d.id, type: 'flight', data: d, startDate: b, endDate: k, durationDays: W });
          }),
        y.hotels &&
          y.hotels.forEach((d) => {
            if (!d.checkInDateTime) return;
            let b = new Date(d.checkInDateTime);
            b.setHours(0, 0, 0, 0);
            let k = new Date(d.checkOutDateTime || d.checkInDateTime);
            k.setHours(0, 0, 0, 0);
            const W = Math.ceil((k.getTime() - b.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
            X({ id: d.id, type: 'hotel', data: d, startDate: b, endDate: k, durationDays: W });
          }),
        y.events &&
          y.events.forEach((d) => {
            if (!d.startDateTime) return;
            let b = new Date(d.startDateTime);
            b.setHours(0, 0, 0, 0);
            let k = new Date(d.endDateTime || d.startDateTime);
            k.setHours(0, 0, 0, 0);
            const W = Math.ceil((k.getTime() - b.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
            X({ id: d.id, type: 'event', data: d, startDate: b, endDate: k, durationDays: W });
          }),
        y.transportation &&
          y.transportation.forEach((d) => {
            if (!d.departureDateTime) return;
            let b = new Date(d.departureDateTime);
            b.setHours(0, 0, 0, 0);
            let k = new Date(d.arrivalDateTime || d.departureDateTime);
            k.setHours(0, 0, 0, 0);
            const W = Math.ceil((k.getTime() - b.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
            X({
              id: d.id,
              type: 'transportation',
              data: d,
              startDate: b,
              endDate: k,
              durationDays: W,
            });
          }),
        y.carRentals &&
          y.carRentals.forEach((d) => {
            if (!d.pickupDateTime) return;
            let b = new Date(d.pickupDateTime);
            b.setHours(0, 0, 0, 0);
            let k = new Date(d.dropoffDateTime || d.pickupDateTime);
            k.setHours(0, 0, 0, 0);
            const W = Math.ceil((k.getTime() - b.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
            X({ id: d.id, type: 'carRental', data: d, startDate: b, endDate: k, durationDays: W });
          }));
    }),
      ['flights', 'hotels', 'transportation', 'carRentals', 'events'].forEach((y) => {
        const E = {
          flights: 'flight',
          hotels: 'hotel',
          transportation: 'transportation',
          carRentals: 'carRental',
          events: 'event',
        }[y];
        f()[y] &&
          f()[y].forEach((M) => {
            let P, d;
            if (y === 'flights')
              ((P = new Date(M.departureDateTime)),
                (d = new Date(M.arrivalDateTime || M.departureDateTime)));
            else if (y === 'hotels')
              ((P = new Date(M.checkInDateTime)),
                (d = new Date(M.checkOutDateTime || M.checkInDateTime)));
            else if (y === 'transportation')
              ((P = new Date(M.departureDateTime)),
                (d = new Date(M.arrivalDateTime || M.departureDateTime)));
            else if (y === 'carRentals')
              ((P = new Date(M.pickupDateTime)),
                (d = new Date(M.dropoffDateTime || M.pickupDateTime)));
            else if (y === 'events')
              ((P = new Date(M.startDateTime)), (d = new Date(M.endDateTime || M.startDateTime)));
            else return;
            (P.setHours(0, 0, 0, 0), d.setHours(0, 0, 0, 0));
            const b = Math.ceil((d.getTime() - P.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
            X({ id: M.id, type: E, data: M, startDate: P, endDate: d, durationDays: b });
          });
      }),
      A(),
      le(F, j));
  }
  function A() {
    l(R, {});
    const F = [],
      j = Object.values(h).flat();
    Array.from(new Map(j.map((X) => [X.id, X])).values()).forEach((X) => {
      const y = _e(X.startDate).getTime(),
        Q = _e(X.endDate).getTime();
      let E = -1;
      for (let M = 0; M < F.length; M++) {
        let P = !0;
        for (const d of F[M]) {
          const b = _e(d.startDate).getTime(),
            k = _e(d.endDate).getTime();
          if (!(Q < b || y > k)) {
            P = !1;
            break;
          }
        }
        if (P) {
          ((E = M), F[M].push(X));
          break;
        }
      }
      (E === -1 && ((E = F.length), F.push([X])), Y(R, (e(R)[X.id] = E)));
    });
  }
  function le(F, j) {
    l(v, []);
    let K = new Date(F);
    for (; K < j; ) {
      const X = { month: K.getMonth(), year: K.getFullYear() },
        y = new Date(K.getFullYear(), K.getMonth() + 1, 0).getDate(),
        Q = [];
      for (let E = 1; E <= y; E++) {
        const M = new Date(K.getFullYear(), K.getMonth(), E, 0, 0, 0, 0),
          P = ve(M);
        Q.push({ day: E, dateKey: P, items: h[P] || [], isToday: P === ve(L), isBlank: !1 });
      }
      for (let E = y; E < 31; E++)
        Q.push({ day: null, dateKey: null, items: [], isToday: !1, isBlank: !0 });
      (e(v).push({ month: X.month, year: X.year, name: g[X.month], days: Q }),
        K.setMonth(K.getMonth() + 1));
    }
  }
  function ye(F) {
    return u[F.type] || '#666666';
  }
  function ge(F) {
    const { type: j, data: K } = F;
    return j === 'trip'
      ? K.name
      : j === 'flight'
        ? `${K.origin?.substring(0, 3) || '?'} → ${K.destination?.substring(0, 3) || '?'}`
        : j === 'hotel'
          ? K.hotelName || K.name || 'Hotel'
          : j === 'event'
            ? K.name || 'Event'
            : j === 'transportation'
              ? `${K.method || 'Transit'}`
              : j === 'carRental'
                ? K.company || 'Car Rental'
                : 'Item';
  }
  function I(F) {
    return (
      {
        trip: 'luggage',
        flight: 'flight',
        hotel: 'hotel',
        event: 'event',
        transportation: 'train',
        carRental: 'directions_car',
      }[F.type] || 'info'
    );
  }
  function se(F) {
    C()(F.type, F.type, F.data);
  }
  (fa(
    () => {},
    () => {
      n();
    }
  ),
    sr(),
    aa());
  var xe = gs(),
    J = a(xe);
  (bt(
    J,
    5,
    () => e(v),
    (F) => F.year * 12 + F.month,
    (F, j) => {
      const K = vt(
          () => (
            e(j),
            e(R),
            s(() =>
              e(j)
                .days.flatMap((re) => re.items)
                .reduce((re, ie) => {
                  const ce = e(R)[ie.id] ?? 0;
                  return Math.max(re, ce);
                }, -1)
            )
          )
        ),
        X = vt(() => (Se(e(K)), s(() => Math.max(2, 1.2 + (e(K) + 1) * 1.75))));
      var y = hs(),
        Q = a(y),
        E = a(Q),
        M = a(E, !0);
      t(E);
      var P = r(E, 2),
        d = a(P, !0);
      (t(P), t(Q));
      var b = r(Q, 2),
        k = a(b);
      (bt(
        k,
        5,
        () => (e(j), s(() => e(j).days)),
        ha,
        (re, ie, ce) => {
          var B = he(),
            Z = oe(B);
          (bt(
            Z,
            1,
            () => (e(ie), s(() => e(ie).items)),
            (G) => G.id,
            (G, U) => {
              const pe = vt(() => (e(R), e(U), s(() => e(R)[e(U).id] ?? 0))),
                $e = vt(
                  () => (
                    e(j),
                    e(U),
                    s(() => e(j).days.findIndex((Mt) => Mt.dateKey === ve(e(U).startDate)))
                  )
                ),
                Ve = vt(
                  () => (
                    e(j),
                    e(U),
                    s(() => e(j).days.findIndex((Mt) => Mt.dateKey === ve(e(U).endDate)))
                  )
                ),
                Et = vt(() => (e($e) >= 0 ? e($e) : e($e) < 0 && e(Ve) >= 0 ? 0 : ce)),
                Xe = vt(
                  () => (
                    Se(e(Ve)),
                    Se(e(Et)),
                    s(() => Math.max(1, (e(Ve) >= 0 ? e(Ve) : 30) - e(Et) + 1))
                  )
                );
              var st = he(),
                Je = oe(st);
              {
                var Nt = (Mt) => {
                  var N = ps();
                  let ee;
                  var ae = a(N);
                  {
                    var ke = (qe) => {
                      var m = cs(),
                        $ = a(m, !0);
                      (t(m), V((T) => O($, T), [() => (e(U), s(() => I(e(U))))]), p(qe, m));
                    };
                    S(ae, (qe) => {
                      (e(U), s(() => e(U).type !== 'flight') && qe(ke));
                    });
                  }
                  var ze = r(ae, 2);
                  {
                    var Ge = (qe) => {
                        var m = vs(),
                          $ = a(m),
                          T = a($, !0);
                        t($);
                        var _ = r($, 2),
                          q = a(_, !0);
                        (t(_),
                          t(m),
                          V(
                            (de, Ie) => {
                              (O(T, de), O(q, Ie));
                            },
                            [
                              () => (e(U), s(() => e(U).data.origin?.substring(0, 3) || '?')),
                              () => (e(U), s(() => e(U).data.destination?.substring(0, 3) || '?')),
                            ]
                          ),
                          p(qe, m));
                      },
                      Dt = (qe) => {
                        var m = us(),
                          $ = a(m, !0);
                        (t(m), V((T) => O($, T), [() => (e(U), s(() => ge(e(U))))]), p(qe, m));
                      };
                    S(ze, (qe) => {
                      (e(U), s(() => e(U).type === 'flight') ? qe(Ge) : qe(Dt, !1));
                    });
                  }
                  (t(N),
                    V(
                      (qe, m) => {
                        ((ee = Pt(N, 1, 'item-bar svelte-1qvkaye', null, ee, {
                          'flight-item': e(U).type === 'flight',
                        })),
                          Lr(
                            N,
                            `
                      --day-idx: ${e(Et) ?? ''};
                      --span: ${e(Xe) ?? ''};
                      --row-in-month: ${e(pe) ?? ''};
                      background-color: ${qe ?? ''}4d;
                      color: ${m ?? ''};
                    `
                          ));
                      },
                      [
                        () => (e(U), s(() => ye(e(U)))),
                        () => (e(U), s(() => (e(U).type === 'flight' ? '#5a4a0f' : ye(e(U))))),
                      ]
                    ),
                    z('click', N, () => se(e(U))),
                    z('keydown', N, (qe) => qe.key === 'Enter' && se(e(U))),
                    p(Mt, N));
                };
                S(Je, (Mt) => {
                  (e($e) === ce || (e($e) < 0 && ce === 0 && e(Ve) >= 0)) && Mt(Nt);
                });
              }
              p(G, st);
            }
          ),
            p(re, B));
        }
      ),
        t(k));
      var W = r(k, 2);
      (bt(
        W,
        1,
        () => (e(j), s(() => e(j).days)),
        ha,
        (re, ie) => {
          var ce = fs();
          let B;
          var Z = a(ce);
          {
            var G = (U) => {
              var pe = ms(),
                $e = a(pe, !0);
              (t(pe), V(() => O($e, (e(ie), s(() => e(ie).day)))), p(U, pe));
            };
            S(Z, (U) => {
              (e(ie), s(() => !e(ie).isBlank && e(ie).day) && U(G));
            });
          }
          (t(ce),
            V(
              (U) => (B = Pt(ce, 1, 'day-cell svelte-1qvkaye', null, B, U)),
              [
                () => ({
                  today: e(ie).isToday,
                  blank: e(ie).isBlank,
                  weekend:
                    !e(ie).isBlank && e(ie).dateKey && new Date(e(ie).dateKey).getDay() % 6 === 0,
                  special: e(ie).dateKey && te(e(ie).dateKey),
                }),
              ]
            ),
            p(re, ce));
        }
      ),
        t(b),
        t(y),
        V(
          (re) => {
            (Lr(y, `min-height: ${e(X) ?? ''}rem;`), O(M, re), O(d, (e(j), s(() => e(j).year))));
          },
          [() => (e(j), s(() => e(j).name.substring(0, 3)))]
        ),
        p(F, y));
    }
  ),
    t(J),
    t(xe),
    p(i, xe),
    ta());
}
function ca() {
  if (typeof window < 'u') {
    const i = window.location.hostname,
      o = window.location.protocol;
    return window.location.port === '5173'
      ? `${o}//${i}:3501`
      : i === 'localhost' || i === '127.0.0.1'
        ? `${o}//localhost:3000`
        : `${o}//${i}:3501`;
  }
  return 'http://localhost:3000';
}
const ya = {
  async updateProfile(i) {
    const o = ca(),
      c = await fetch(`${o}/account/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(i),
        credentials: 'include',
      });
    if (!c.ok) throw new Error(`Failed to update profile: ${c.statusText}`);
    return c.json();
  },
  async changePassword(i) {
    const o = ca(),
      c = await fetch(`${o}/account/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(i),
        credentials: 'include',
      });
    if (!c.ok) throw new Error(`Failed to change password: ${c.statusText}`);
    return c.json();
  },
  async getVouchers() {
    const i = ca(),
      o = await fetch(`${i}/vouchers`, { method: 'GET', credentials: 'include' });
    if (!o.ok) throw new Error(`Failed to fetch vouchers: ${o.statusText}`);
    return o.json();
  },
  async getVoucherDetails(i) {
    const o = ca(),
      c = await fetch(`${o}/account/vouchers/${i}/details`, {
        method: 'GET',
        credentials: 'include',
      });
    if (!c.ok) throw new Error(`Failed to fetch voucher details: ${c.statusText}`);
    return c.json();
  },
  async createVoucher(i) {
    const o = ca(),
      c = await fetch(`${o}/vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(i),
        credentials: 'include',
      });
    if (!c.ok) throw new Error(`Failed to create voucher: ${c.statusText}`);
    return c.json();
  },
  async updateVoucher(i, o) {
    const c = ca(),
      f = await fetch(`${c}/vouchers/${i}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(o),
        credentials: 'include',
      });
    if (!f.ok) throw new Error(`Failed to update voucher: ${f.statusText}`);
    return f.json();
  },
  async deleteVoucher(i) {
    const o = ca(),
      c = await fetch(`${o}/vouchers/${i}`, { method: 'DELETE', credentials: 'include' });
    if (!c.ok) throw new Error(`Failed to delete voucher: ${c.statusText}`);
    return c.json();
  },
  async getCompanions() {
    const i = ca(),
      o = await fetch(`${i}/companions/api/json`, { method: 'GET', credentials: 'include' });
    if (!o.ok) throw new Error(`Failed to fetch companions: ${o.statusText}`);
    return await o.json();
  },
  async getAllCompanions() {
    const i = ca(),
      o = await fetch(`${i}/companions/api/all`, { method: 'GET', credentials: 'include' });
    if (!o.ok) throw new Error(`Failed to fetch all companions: ${o.statusText}`);
    return o.json();
  },
  async createCompanion(i) {
    const o = ca(),
      c = await fetch(`${o}/companions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(i),
        credentials: 'include',
      });
    if (!c.ok) throw new Error(`Failed to create companion: ${c.statusText}`);
    return c.json();
  },
  async updateCompanion(i, o) {
    const c = ca(),
      f = await fetch(`${c}/companions/${i}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(o),
        credentials: 'include',
      });
    if (!f.ok) throw new Error(`Failed to update companion: ${f.statusText}`);
    return f.json();
  },
  async removeCompanion(i) {
    const o = ca(),
      c = await fetch(`${o}/companions/${i}`, { method: 'DELETE', credentials: 'include' });
    if (!c.ok) throw new Error(`Failed to remove companion: ${c.statusText}`);
    return c.json();
  },
  async revokeCompanionAccess(i) {
    const o = ca(),
      c = await fetch(`${o}/account/companions/${i}/revoke`, {
        method: 'PUT',
        credentials: 'include',
      });
    if (!c.ok) throw new Error(`Failed to revoke companion access: ${c.statusText}`);
    return c.json();
  },
  async exportData() {
    const i = ca(),
      o = await fetch(`${i}/account/export`, { method: 'GET', credentials: 'include' });
    if (!o.ok) throw new Error(`Export failed: ${o.statusText}`);
    return o.blob();
  },
  async previewImport(i) {
    const o = ca(),
      c = new FormData();
    c.append('file', i);
    const f = await fetch(`${o}/account/data/preview`, {
      method: 'POST',
      credentials: 'include',
      body: c,
    });
    if (!f.ok) {
      let C = 'Failed to preview import';
      try {
        C = (await f.json()).message || C;
      } catch {}
      throw new Error(C);
    }
    return f.json();
  },
  async importData(i) {
    const o = ca(),
      c = await fetch(`${o}/account/data/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(i),
        credentials: 'include',
      });
    if (!c.ok) throw new Error(`Failed to import data: ${c.statusText}`);
    return c.json();
  },
};
var ys = w('<div class="error-message"> </div>'),
  bs = w(
    '<div class="edit-panel"><form class="edit-content"><!> <div class="form-fields"><div class="form-row cols-2"><div class="form-group"><label for="firstName">First Name</label> <input type="text" id="firstName" placeholder="John" required/></div> <div class="form-group"><label for="lastName">Last Initial</label> <input type="text" id="lastName" placeholder="D" maxlength="1" required/></div></div> <div class="form-group"><label for="email">Email Address</label> <input type="email" id="email" placeholder="john@example.com" autocomplete="new-email" required/></div></div> <div class="form-buttons"><button type="submit" class="submit-btn"> </button> <button type="button" class="cancel-btn">Cancel</button></div></form></div>'
  );
function xs(i, o) {
  ea(o, !1);
  let c = Ae(o, 'data', 12, null),
    f = ne(!1),
    C = ne(null),
    g = ne({
      firstName: c()?.firstName || '',
      lastName: c()?.lastName || '',
      email: c()?.email || '',
    }),
    u = c()?.email || '';
  function v() {
    return (
      l(C, null),
      e(g).firstName.trim()
        ? e(g).lastName.trim()
          ? e(g).lastName.length > 1
            ? (l(C, 'Last initial must be a single character'), !1)
            : e(g).email.trim()
              ? e(g).email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
                ? !0
                : (l(C, 'Please enter a valid email address'), !1)
              : (l(C, 'Email is required'), !1)
          : (l(C, 'Last initial is required'), !1)
        : (l(C, 'First name is required'), !1)
    );
  }
  async function h() {
    if (v())
      try {
        (l(f, !0), l(C, null));
        const j = await ya.updateProfile({
          firstName: e(g).firstName,
          lastName: e(g).lastName,
          email: e(g).email,
        });
        j && j.success
          ? j.data?.user && (On.setUser(j.data.user), c(j.data.user), (u = e(g).email))
          : l(C, j?.message || 'Failed to update profile');
      } catch (j) {
        l(C, j instanceof Error ? j.message : 'An error occurred while updating your profile');
      } finally {
        l(f, !1);
      }
  }
  function R() {
    (l(g, {
      firstName: c()?.firstName || '',
      lastName: c()?.lastName || '',
      email: c()?.email || '',
    }),
      l(C, null));
  }
  aa();
  var L = bs(),
    ue = a(L),
    te = a(ue);
  {
    var ve = (j) => {
      var K = ys(),
        X = a(K, !0);
      (t(K), V(() => O(X, e(C))), p(j, K));
    };
    S(te, (j) => {
      e(C) && j(ve);
    });
  }
  var we = r(te, 2),
    _e = a(we),
    n = a(_e),
    A = r(a(n), 2);
  (fe(A), t(n));
  var le = r(n, 2),
    ye = r(a(le), 2);
  (fe(ye), t(le), t(_e));
  var ge = r(_e, 2),
    I = r(a(ge), 2);
  (fe(I), t(ge), t(we));
  var se = r(we, 2),
    xe = a(se),
    J = a(xe, !0);
  t(xe);
  var F = r(xe, 2);
  (t(se),
    t(ue),
    t(L),
    V(() => {
      ((xe.disabled = e(f)), O(J, e(f) ? 'Saving...' : 'Update Profile'), (F.disabled = e(f)));
    }),
    me(
      A,
      () => e(g).firstName,
      (j) => Y(g, (e(g).firstName = j))
    ),
    me(
      ye,
      () => e(g).lastName,
      (j) => Y(g, (e(g).lastName = j))
    ),
    z('change', ye, (j) => Y(g, (e(g).lastName = j.currentTarget.value.substring(0, 1)))),
    me(
      I,
      () => e(g).email,
      (j) => Y(g, (e(g).email = j))
    ),
    z('click', F, R),
    z('submit', ue, xr(h)),
    p(i, L),
    ta());
}
var Ts = w('<div class="error-message"> </div>'),
  Ds = w('<span class="field-error">Passwords do not match</span>'),
  ws = w(
    '<div class="edit-panel"><form class="edit-content"><!> <div class="form-fields"><div class="form-group"><label for="currentPassword">Current Password</label> <input type="password" id="currentPassword" placeholder="Enter your current password" required/></div> <div class="password-info svelte-1w2c911"><p class="info-text svelte-1w2c911"><span class="material-symbols-outlined">info</span> Password must be at least 6 characters long</p></div> <div class="form-group"><label for="newPassword">New Password</label> <input type="password" id="newPassword" placeholder="Enter your new password" required/></div> <div class="form-group"><label for="confirmPassword">Confirm New Password</label> <input type="password" id="confirmPassword" placeholder="Confirm your new password" required/> <!></div></div> <div class="form-buttons"><button type="submit" class="submit-btn"> </button> <button type="button" class="cancel-btn">Cancel</button></div></form></div>'
  );
function Cs(i, o) {
  ea(o, !1);
  let c = ne(!1),
    f = ne(null),
    C = ne({ currentPassword: '', newPassword: '', confirmPassword: '' }),
    g = ne(!0);
  function u() {
    return (
      l(f, null),
      l(g, e(C).newPassword === e(C).confirmPassword),
      e(C).currentPassword.trim()
        ? e(C).newPassword.trim()
          ? e(C).newPassword.length < 6
            ? (l(f, 'New password must be at least 6 characters'), !1)
            : e(C).confirmPassword.trim()
              ? e(g)
                ? !0
                : (l(f, 'New passwords do not match'), !1)
              : (l(f, 'Password confirmation is required'), !1)
          : (l(f, 'New password is required'), !1)
        : (l(f, 'Current password is required'), !1)
    );
  }
  async function v() {
    if (u())
      try {
        (l(c, !0), l(f, null));
        const X = await ya.changePassword({
          currentPassword: e(C).currentPassword,
          newPassword: e(C).newPassword,
          confirmPassword: e(C).confirmPassword,
        });
        X && X.success ? h() : l(f, X?.message || 'Failed to change password');
      } catch (X) {
        const y = X instanceof Error ? X.message : 'An error occurred while changing your password';
        l(f, y);
      } finally {
        l(c, !1);
      }
  }
  function h() {
    (l(C, { currentPassword: '', newPassword: '', confirmPassword: '' }), l(g, !0), l(f, null));
  }
  function R() {
    h();
  }
  function L() {
    (e(C).newPassword || e(C).confirmPassword) && l(g, e(C).newPassword === e(C).confirmPassword);
  }
  aa();
  var ue = ws(),
    te = a(ue),
    ve = a(te);
  {
    var we = (X) => {
      var y = Ts(),
        Q = a(y, !0);
      (t(y), V(() => O(Q, e(f))), p(X, y));
    };
    S(ve, (X) => {
      e(f) && X(we);
    });
  }
  var _e = r(ve, 2),
    n = a(_e),
    A = r(a(n), 2);
  (fe(A), t(n));
  var le = r(n, 4),
    ye = r(a(le), 2);
  (fe(ye), t(le));
  var ge = r(le, 2),
    I = r(a(ge), 2);
  fe(I);
  var se = r(I, 2);
  {
    var xe = (X) => {
      var y = Ds();
      p(X, y);
    };
    S(se, (X) => {
      !e(g) && e(C).confirmPassword && X(xe);
    });
  }
  (t(ge), t(_e));
  var J = r(_e, 2),
    F = a(J),
    j = a(F, !0);
  t(F);
  var K = r(F, 2);
  (t(J),
    t(te),
    t(ue),
    V(() => {
      (Ar(A, e(C).currentPassword),
        (A.disabled = e(c)),
        Ar(ye, e(C).newPassword),
        (ye.disabled = e(c)),
        Ar(I, e(C).confirmPassword),
        (I.disabled = e(c)),
        (F.disabled = e(c) || !e(g)),
        O(j, e(c) ? 'Saving...' : 'Change Password'),
        (K.disabled = e(c)));
    }),
    z('change', A, (X) => Y(C, (e(C).currentPassword = X.currentTarget.value))),
    z('change', ye, (X) => Y(C, (e(C).newPassword = X.currentTarget.value))),
    z('input', ye, L),
    z('change', I, (X) => Y(C, (e(C).confirmPassword = X.currentTarget.value))),
    z('input', I, L),
    z('click', K, R),
    z('submit', te, xr(v)),
    p(i, ue),
    ta());
}
var ks = w('<div class="error-message"> </div>'),
  Es = w('<option> </option>'),
  js = w('<option> </option>'),
  Ns = w(
    '<div class="edit-content"><!> <form><div class="form-fields"><div class="form-group"><label>Voucher Number *</label> <input type="text" placeholder="e.g., 123456789" required/></div> <div class="form-row cols-2"><div class="form-group"><label>Type *</label> <select required></select></div> <div class="form-group"><label>Issuer *</label> <input type="text" placeholder="e.g., United Airlines" required/></div></div> <div class="form-row cols-2"><div class="form-group"><label>Associated Account</label> <input type="text" placeholder="e.g., Frequent flyer number"/></div> <div class="form-group"><label>PIN Code</label> <input type="password" placeholder="PIN or security code"/></div></div> <div class="form-row cols-2"><div class="form-group"><label>Currency</label> <select></select></div> <div class="form-group"><label>Total Value</label> <input type="number" step="0.01" min="0" placeholder="0.00"/></div></div> <div class="form-group"><label>Expiration Date</label> <input type="date"/></div> <div class="form-group"><label>Notes</label> <textarea placeholder="Any additional information about this voucher..." rows="3"></textarea></div></div> <div class="form-buttons"><button class="submit-btn" type="submit"> </button> <button class="cancel-btn" type="button">Cancel</button></div></form></div>'
  );
function Fr(i, o) {
  (ea(o, !1), Ae(o, 'tripId', 8));
  let c = Ae(o, 'voucherId', 8, null),
    f = Ae(o, 'voucher', 8, null),
    C = Ae(o, 'onSuccess', 8, null),
    g = Ae(o, 'onCancel', 8, null),
    u = ne(!1),
    v = ne(null),
    h = ne({
      type: f()?.type || 'TRAVEL_CREDIT',
      issuer: f()?.issuer || '',
      voucherNumber: f()?.voucherNumber || '',
      associatedAccount: f()?.associatedAccount || '',
      pinCode: f()?.pinCode || '',
      currency: f()?.currency || 'USD',
      totalValue: f()?.totalValue ? parseFloat(f().totalValue).toString() : '',
      expirationDate: f()?.expirationDate
        ? new Date(f().expirationDate).toISOString().split('T')[0]
        : '',
      notes: f()?.notes || '',
    });
  const R = [
      { value: 'TRAVEL_CREDIT', label: 'Travel Credit' },
      { value: 'UPGRADE_CERT', label: 'Upgrade Certificate' },
      { value: 'REGIONAL_UPGRADE_CERT', label: 'Regional Upgrade Cert' },
      { value: 'GLOBAL_UPGRADE_CERT', label: 'Global Upgrade Cert' },
      { value: 'COMPANION_CERT', label: 'Companion Certificate' },
      { value: 'GIFT_CARD', label: 'Gift Card' },
      { value: 'MISC', label: 'Miscellaneous' },
    ],
    L = [
      { value: 'USD', label: 'USD ($)' },
      { value: 'EUR', label: 'EUR (€)' },
      { value: 'GBP', label: 'GBP (£)' },
      { value: 'JPY', label: 'JPY (¥)' },
      { value: 'CAD', label: 'CAD (C$)' },
      { value: 'AUD', label: 'AUD (A$)' },
    ];
  async function ue() {
    try {
      if (!e(h).voucherNumber.trim()) {
        l(v, 'Voucher number is required');
        return;
      }
      if (!e(h).issuer.trim()) {
        l(v, 'Issuer is required');
        return;
      }
      if (
        ![
          'UPGRADE_CERT',
          'COMPANION_CERT',
          'REGIONAL_UPGRADE_CERT',
          'GLOBAL_UPGRADE_CERT',
        ].includes(e(h).type)
      ) {
        if (!e(h).totalValue) {
          l(v, 'Total value is required for this voucher type');
          return;
        }
        const $e = parseFloat(e(h).totalValue);
        if (isNaN($e) || $e <= 0) {
          l(v, 'Total value must be a positive number');
          return;
        }
      }
      (l(u, !0), l(v, null));
      let U;
      const pe = { ...e(h), totalValue: e(h).totalValue ? parseFloat(e(h).totalValue) : null };
      (c()
        ? ((U = await ya.updateVoucher(c(), pe)), (U = U.data || U))
        : ((U = await ya.createVoucher(pe)), (U = U.data || U)),
        C() && C()(U));
    } catch (G) {
      l(v, G instanceof Error ? G.message : 'Failed to save voucher');
    } finally {
      l(u, !1);
    }
  }
  function te() {
    g() && g()();
  }
  aa();
  var ve = Ns(),
    we = a(ve);
  {
    var _e = (G) => {
      var U = ks(),
        pe = a(U, !0);
      (t(U), V(() => O(pe, e(v))), p(G, U));
    };
    S(we, (G) => {
      e(v) && G(_e);
    });
  }
  var n = r(we, 2),
    A = a(n),
    le = a(A),
    ye = r(a(le), 2);
  (fe(ye), t(le));
  var ge = r(le, 2),
    I = a(ge),
    se = r(a(I), 2);
  (V(() => {
    (e(h), rr(() => {}));
  }),
    bt(
      se,
      5,
      () => R,
      ha,
      (G, U) => {
        var pe = Es(),
          $e = a(pe, !0);
        t(pe);
        var Ve = {};
        (V(() => {
          (O($e, (e(U), s(() => e(U).label))),
            Ve !== (Ve = (e(U), s(() => e(U).value))) &&
              (pe.value = (pe.__value = (e(U), s(() => e(U).value))) ?? ''));
        }),
          p(G, pe));
      }
    ),
    t(se),
    t(I));
  var xe = r(I, 2),
    J = r(a(xe), 2);
  (fe(J), t(xe), t(ge));
  var F = r(ge, 2),
    j = a(F),
    K = r(a(j), 2);
  (fe(K), t(j));
  var X = r(j, 2),
    y = r(a(X), 2);
  (fe(y), t(X), t(F));
  var Q = r(F, 2),
    E = a(Q),
    M = r(a(E), 2);
  (V(() => {
    (e(h), rr(() => {}));
  }),
    bt(
      M,
      5,
      () => L,
      ha,
      (G, U) => {
        var pe = js(),
          $e = a(pe, !0);
        t(pe);
        var Ve = {};
        (V(() => {
          (O($e, (e(U), s(() => e(U).label))),
            Ve !== (Ve = (e(U), s(() => e(U).value))) &&
              (pe.value = (pe.__value = (e(U), s(() => e(U).value))) ?? ''));
        }),
          p(G, pe));
      }
    ),
    t(M),
    t(E));
  var P = r(E, 2),
    d = r(a(P), 2);
  (fe(d), t(P), t(Q));
  var b = r(Q, 2),
    k = r(a(b), 2);
  (fe(k), t(b));
  var W = r(b, 2),
    re = r(a(W), 2);
  (Fa(re), t(W), t(A));
  var ie = r(A, 2),
    ce = a(ie),
    B = a(ce, !0);
  t(ce);
  var Z = r(ce, 2);
  (t(ie),
    t(n),
    t(ve),
    V(() => {
      ((ce.disabled = e(u)), O(B, c() ? 'Update Voucher' : 'Add Voucher'), (Z.disabled = e(u)));
    }),
    me(
      ye,
      () => e(h).voucherNumber,
      (G) => Y(h, (e(h).voucherNumber = G))
    ),
    nr(
      se,
      () => e(h).type,
      (G) => Y(h, (e(h).type = G))
    ),
    me(
      J,
      () => e(h).issuer,
      (G) => Y(h, (e(h).issuer = G))
    ),
    me(
      K,
      () => e(h).associatedAccount,
      (G) => Y(h, (e(h).associatedAccount = G))
    ),
    me(
      y,
      () => e(h).pinCode,
      (G) => Y(h, (e(h).pinCode = G))
    ),
    nr(
      M,
      () => e(h).currency,
      (G) => Y(h, (e(h).currency = G))
    ),
    me(
      d,
      () => e(h).totalValue,
      (G) => Y(h, (e(h).totalValue = G))
    ),
    me(
      k,
      () => e(h).expirationDate,
      (G) => Y(h, (e(h).expirationDate = G))
    ),
    me(
      re,
      () => e(h).notes,
      (G) => Y(h, (e(h).notes = G))
    ),
    z('click', Z, te),
    z('submit', n, xr(ue)),
    p(i, ve),
    ta());
}
var Ss = w('<div> </div>'),
  Is = w('<div class="provider svelte-qc6r1s"> </div>'),
  Ms = w(
    '<div class="detail-row svelte-qc6r1s"><label class="svelte-qc6r1s">Description</label> <p class="svelte-qc6r1s"> </p></div>'
  ),
  $s = w(
    '<div class="detail-row svelte-qc6r1s"><label class="svelte-qc6r1s">Expiration Date</label> <p class="svelte-qc6r1s"> </p></div>'
  ),
  As = w(
    '<div class="detail-row svelte-qc6r1s"><label class="svelte-qc6r1s">Notes</label> <p class="svelte-qc6r1s"> </p></div>'
  ),
  qs = w(
    '<div class="detail-row svelte-qc6r1s"><label class="svelte-qc6r1s">Added</label> <p class="svelte-qc6r1s"> </p></div>'
  ),
  Ps = w('<span class="material-symbols-outlined">edit</span> Edit', 1),
  Rs = w('<span class="material-symbols-outlined">delete</span> Delete', 1),
  Ls = w(
    '<div class="voucher-details svelte-qc6r1s"><div class="detail-header svelte-qc6r1s"><h3 class="svelte-qc6r1s"> </h3> <!></div> <div class="detail-content"><div class="discount-box svelte-qc6r1s"><div class="discount-value svelte-qc6r1s"> </div> <!></div> <div class="details-grid svelte-qc6r1s"><!> <!> <!> <!></div> <div class="detail-actions svelte-qc6r1s"><!> <!> <!></div></div></div>'
  );
function Fs(i, o) {
  ea(o, !1);
  let c = Ae(o, 'voucherId', 8),
    f = Ae(o, 'voucher', 8),
    C = Ae(o, 'onClose', 8, null),
    g = Ae(o, 'onEdit', 8, null),
    u = Ae(o, 'onDelete', 8, null),
    v = ne(!1);
  function h(B) {
    if (!B) return 'No expiration';
    try {
      return new Date(B).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return B;
    }
  }
  function R(B) {
    if (!B) return -1;
    try {
      const Z = new Date(B),
        G = new Date();
      (G.setHours(0, 0, 0, 0), Z.setHours(0, 0, 0, 0));
      const U = Z.getTime() - G.getTime();
      return Math.ceil(U / (1e3 * 60 * 60 * 24));
    } catch {
      return -1;
    }
  }
  function L(B) {
    return R(B) < 0;
  }
  function ue(B) {
    const Z = R(B);
    return Z < 0
      ? 'Expired'
      : Z === 0
        ? 'Expires today'
        : Z === 1
          ? 'Expires in 1 day'
          : Z <= 7
            ? `Expires in ${Z} days`
            : Z <= 30
              ? `Expires in ${Math.floor(Z / 7)} weeks`
              : `Expires in ${Math.floor(Z / 30)} months`;
  }
  function te(B) {
    return B.discountType === 'percentage'
      ? `${B.discountValue}% off`
      : `$${parseFloat(B.discountValue).toFixed(2)} off`;
  }
  async function ve() {
    if (confirm('Are you sure you want to delete this voucher?')) {
      l(v, !0);
      try {
        (await ya.deleteVoucher(c()), u() && u()(c()), C() && C()());
      } catch {
        (alert('Failed to delete voucher'), l(v, !1));
      }
    }
  }
  function we() {
    g() && g()(c());
  }
  aa();
  var _e = Ls(),
    n = a(_e),
    A = a(n),
    le = a(A, !0);
  t(A);
  var ye = r(A, 2);
  {
    var ge = (B) => {
      var Z = Ss();
      let G;
      var U = a(Z, !0);
      (t(Z),
        V(
          (pe, $e) => {
            ((G = Pt(Z, 1, 'status-badge svelte-qc6r1s', null, G, pe)), O(U, $e));
          },
          [
            () => ({ expired: L(f().expirationDate) }),
            () => (Se(f()), s(() => ue(f().expirationDate))),
          ]
        ),
        p(B, Z));
    };
    S(ye, (B) => {
      (Se(f()), s(() => f().expirationDate) && B(ge));
    });
  }
  t(n);
  var I = r(n, 2),
    se = a(I),
    xe = a(se),
    J = a(xe, !0);
  t(xe);
  var F = r(xe, 2);
  {
    var j = (B) => {
      var Z = Is(),
        G = a(Z, !0);
      (t(Z), V(() => O(G, (Se(f()), s(() => f().provider)))), p(B, Z));
    };
    S(F, (B) => {
      (Se(f()), s(() => f().provider) && B(j));
    });
  }
  t(se);
  var K = r(se, 2),
    X = a(K);
  {
    var y = (B) => {
      var Z = Ms(),
        G = r(a(Z), 2),
        U = a(G, !0);
      (t(G), t(Z), V(() => O(U, (Se(f()), s(() => f().description)))), p(B, Z));
    };
    S(X, (B) => {
      (Se(f()), s(() => f().description) && B(y));
    });
  }
  var Q = r(X, 2);
  {
    var E = (B) => {
      var Z = $s(),
        G = r(a(Z), 2),
        U = a(G, !0);
      (t(G), t(Z), V((pe) => O(U, pe), [() => (Se(f()), s(() => h(f().expirationDate)))]), p(B, Z));
    };
    S(Q, (B) => {
      (Se(f()), s(() => f().expirationDate) && B(E));
    });
  }
  var M = r(Q, 2);
  {
    var P = (B) => {
      var Z = As(),
        G = r(a(Z), 2),
        U = a(G, !0);
      (t(G), t(Z), V(() => O(U, (Se(f()), s(() => f().notes)))), p(B, Z));
    };
    S(M, (B) => {
      (Se(f()), s(() => f().notes) && B(P));
    });
  }
  var d = r(M, 2);
  {
    var b = (B) => {
      var Z = qs(),
        G = r(a(Z), 2),
        U = a(G, !0);
      (t(G), t(Z), V((pe) => O(U, pe), [() => (Se(f()), s(() => h(f().createdAt)))]), p(B, Z));
    };
    S(d, (B) => {
      (Se(f()), s(() => f().createdAt) && B(b));
    });
  }
  t(K);
  var k = r(K, 2),
    W = a(k);
  Ua(W, {
    variant: 'primary',
    get disabled() {
      return e(v);
    },
    $$events: { click: we },
    children: (B, Z) => {
      var G = Ps();
      (Wt(), p(B, G));
    },
    $$slots: { default: !0 },
  });
  var re = r(W, 2);
  Ua(re, {
    variant: 'danger',
    get disabled() {
      return e(v);
    },
    get loading() {
      return e(v);
    },
    $$events: { click: ve },
    children: (B, Z) => {
      var G = Rs();
      (Wt(), p(B, G));
    },
    $$slots: { default: !0 },
  });
  var ie = r(re, 2);
  {
    var ce = (B) => {
      Ua(B, {
        variant: 'secondary',
        get disabled() {
          return e(v);
        },
        $$events: {
          click(...Z) {
            C()?.apply(this, Z);
          },
        },
        children: (Z, G) => {
          Wt();
          var U = Ca('Close');
          p(Z, U);
        },
        $$slots: { default: !0 },
      });
    };
    S(ie, (B) => {
      C() && B(ce);
    });
  }
  (t(k),
    t(I),
    t(_e),
    V(
      (B) => {
        (O(le, (Se(f()), s(() => f().code))), O(J, B));
      },
      [() => (Se(f()), s(() => te(f())))]
    ),
    p(i, _e),
    ta());
}
var Os = w('<span class="material-symbols-outlined">add</span> Add Voucher', 1),
  zs = w(
    '<div class="tabs-header svelte-113vqn2"><div class="tabs svelte-113vqn2"><button> </button> <button> </button></div> <!></div>'
  ),
  Us = w(
    '<div class="loading-state svelte-113vqn2"><span class="material-symbols-outlined">hourglass_empty</span> <p>Loading vouchers...</p></div>'
  ),
  Hs = w(
    '<div class="empty-state svelte-113vqn2"><span class="material-symbols-outlined">card_giftcard</span> <p class="svelte-113vqn2"> </p> <!></div>'
  ),
  Bs = w(
    '<tr><td class="voucher-number svelte-113vqn2"> </td><td class="svelte-113vqn2"> </td><td class="svelte-113vqn2"> </td><td class="currency-value svelte-113vqn2"> </td><td class="svelte-113vqn2"> </td><td class="svelte-113vqn2"><span> </span></td><td class="actions svelte-113vqn2"><button class="action-btn edit svelte-113vqn2" title="Edit"><span class="material-symbols-outlined">edit</span></button> <button class="action-btn delete svelte-113vqn2" title="Delete"><span class="material-symbols-outlined">delete</span></button></td></tr>'
  ),
  Vs = w(
    '<div class="vouchers-table-container svelte-113vqn2"><table class="vouchers-table svelte-113vqn2"><thead class="svelte-113vqn2"><tr><th class="svelte-113vqn2">Voucher Number</th><th class="svelte-113vqn2">Type</th><th class="svelte-113vqn2">Issuer</th><th class="svelte-113vqn2">Remaining Value</th><th class="svelte-113vqn2">Expiration</th><th class="svelte-113vqn2">Status</th><th class="svelte-113vqn2">Actions</th></tr></thead><tbody class="svelte-113vqn2"></tbody></table></div>'
  ),
  Js = w('<div class="vouchers-view svelte-113vqn2"><!> <!></div>'),
  Gs = w(
    '<div class="form-view svelte-113vqn2"><button class="back-btn svelte-113vqn2"><span class="material-symbols-outlined">arrow_back</span> Back to Vouchers</button> <!></div>'
  ),
  Ys = w(
    '<div class="details-view svelte-113vqn2"><button class="back-btn svelte-113vqn2"><span class="material-symbols-outlined">arrow_back</span> Back to Vouchers</button> <!></div>'
  ),
  Ws = w('<div class="settings-vouchers-container svelte-113vqn2"><!> <!> <!></div>');
function Zs(i, o) {
  ea(o, !1);
  let c = Ae(o, 'onEditVoucher', 8, null),
    f = Ae(o, 'onAddVoucher', 8, null),
    C = ne([]),
    g = ne([]),
    u = ne(!0),
    v = ne(null),
    h = ne(null),
    R = ne('list'),
    L = ne(null),
    ue = ne(null),
    te = ne('open');
  Ga(async () => {
    await ve();
  });
  async function ve() {
    try {
      (l(u, !0), l(v, null));
      const d = await ya.getVouchers();
      (l(C, d.data || d || []), _e());
    } catch (d) {
      l(v, d instanceof Error ? d.message : 'Failed to load vouchers');
    } finally {
      l(u, !1);
    }
  }
  function we(d) {
    if (!d) return !1;
    try {
      return new Date(d) < new Date();
    } catch {
      return !1;
    }
  }
  function _e() {
    e(te) === 'open'
      ? l(
          g,
          e(C).filter((d) => !we(d.expirationDate))
        )
      : e(te) === 'closed'
        ? l(
            g,
            e(C).filter((d) => we(d.expirationDate))
          )
        : l(g, e(C));
  }
  function n(d) {
    (l(te, d), _e());
  }
  function A() {
    f() ? f()() : (l(L, null), l(ue, null), l(R, 'form'));
  }
  function le(d) {
    const b = e(C).find((k) => k.id === d);
    c() ? c()(b) : (l(L, d), l(ue, b), l(R, 'form'));
  }
  async function ye(d) {
    const b = d.detail || d;
    (e(L)
      ? (l(
          C,
          e(C).map((k) => (k.id === e(L) ? b : k))
        ),
        l(h, 'Voucher updated successfully'))
      : (l(C, [...e(C), b]), l(h, 'Voucher added successfully')),
      _e(),
      l(R, 'list'),
      l(L, null),
      l(ue, null),
      setTimeout(() => {
        l(h, null);
      }, 3e3));
  }
  function ge() {
    (l(R, 'list'), l(L, null), l(ue, null));
  }
  function I() {
    (l(R, 'list'), l(L, null), l(ue, null));
  }
  async function se(d) {
    (l(
      C,
      e(C).filter((b) => b.id !== d)
    ),
      _e(),
      l(R, 'list'),
      l(L, null),
      l(ue, null),
      l(h, 'Voucher deleted successfully'),
      setTimeout(() => {
        l(h, null);
      }, 3e3));
  }
  function xe(d) {
    (l(R, 'form'),
      l(L, d),
      l(
        ue,
        e(C).find((b) => b.id === d)
      ));
  }
  function J(d) {
    if (!d) return 'No expiration';
    try {
      return new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  }
  function F(d) {
    return d
      ? d
          .replace(/_/g, ' ')
          .split(' ')
          .map((b) => b.charAt(0) + b.slice(1).toLowerCase())
          .join(' ')
      : 'Unknown';
  }
  aa();
  var j = Ws(),
    K = a(j);
  {
    var X = (d) => {
      Ha(d, {
        type: 'error',
        get message() {
          return e(v);
        },
        dismissible: !0,
      });
    };
    S(K, (d) => {
      e(v) && d(X);
    });
  }
  var y = r(K, 2);
  {
    var Q = (d) => {
      Ha(d, {
        type: 'success',
        get message() {
          return e(h);
        },
        dismissible: !0,
      });
    };
    S(y, (d) => {
      e(h) && d(Q);
    });
  }
  var E = r(y, 2);
  {
    var M = (d) => {
        var b = Js(),
          k = a(b);
        {
          var W = (B) => {
            var Z = zs(),
              G = a(Z),
              U = a(G);
            let pe;
            var $e = a(U);
            t(U);
            var Ve = r(U, 2);
            let Et;
            var Xe = a(Ve);
            (t(Ve), t(G));
            var st = r(G, 2);
            (Ua(st, {
              variant: 'primary',
              get disabled() {
                return e(u);
              },
              $$events: { click: A },
              children: (Je, Nt) => {
                var Mt = Os();
                (Wt(), p(Je, Mt));
              },
              $$slots: { default: !0 },
            }),
              t(Z),
              V(
                (Je, Nt) => {
                  ((pe = Pt(U, 1, 'tab-btn svelte-113vqn2', null, pe, {
                    active: e(te) === 'open',
                  })),
                    O($e, `Open (${Je ?? ''})`),
                    (Et = Pt(Ve, 1, 'tab-btn svelte-113vqn2', null, Et, {
                      active: e(te) === 'closed',
                    })),
                    O(Xe, `Expired (${Nt ?? ''})`));
                },
                [
                  () => (e(C), s(() => e(C).filter((Je) => !we(Je.expirationDate)).length)),
                  () => (e(C), s(() => e(C).filter((Je) => we(Je.expirationDate)).length)),
                ]
              ),
              z('click', U, () => n('open')),
              z('click', Ve, () => n('closed')),
              p(B, Z));
          };
          S(k, (B) => {
            e(u) || B(W);
          });
        }
        var re = r(k, 2);
        {
          var ie = (B) => {
              var Z = Us();
              p(B, Z);
            },
            ce = (B) => {
              var Z = he(),
                G = oe(Z);
              {
                var U = ($e) => {
                    var Ve = Hs(),
                      Et = r(a(Ve), 2),
                      Xe = a(Et, !0);
                    t(Et);
                    var st = r(Et, 2);
                    {
                      var Je = (Nt) => {
                        Ua(Nt, {
                          variant: 'primary',
                          $$events: { click: A },
                          children: (Mt, N) => {
                            Wt();
                            var ee = Ca('Add Your First Voucher');
                            p(Mt, ee);
                          },
                          $$slots: { default: !0 },
                        });
                      };
                      S(st, (Nt) => {
                        (e(te), e(C), s(() => e(te) === 'open' && e(C).length === 0) && Nt(Je));
                      });
                    }
                    (t(Ve),
                      V(() =>
                        O(
                          Xe,
                          (e(te),
                          e(C),
                          s(() =>
                            e(te) === 'open' && e(C).length === 0
                              ? 'No vouchers yet'
                              : 'No vouchers in this category'
                          ))
                        )
                      ),
                      p($e, Ve));
                  },
                  pe = ($e) => {
                    var Ve = Vs(),
                      Et = a(Ve),
                      Xe = r(a(Et));
                    (bt(
                      Xe,
                      5,
                      () => e(g),
                      (st) => st.id,
                      (st, Je) => {
                        var Nt = Bs();
                        let Mt;
                        var N = a(Nt),
                          ee = a(N, !0);
                        t(N);
                        var ae = r(N),
                          ke = a(ae, !0);
                        t(ae);
                        var ze = r(ae),
                          Ge = a(ze, !0);
                        t(ze);
                        var Dt = r(ze),
                          qe = a(Dt, !0);
                        t(Dt);
                        var m = r(Dt),
                          $ = a(m, !0);
                        t(m);
                        var T = r(m),
                          _ = a(T);
                        let q;
                        var de = a(_, !0);
                        (t(_), t(T));
                        var Ie = r(T),
                          Me = a(Ie),
                          je = r(Me, 2);
                        (t(Ie),
                          t(Nt),
                          V(
                            (Ue, ot, yt) => {
                              ((Mt = Pt(Nt, 1, 'svelte-113vqn2', null, Mt, {
                                expired: e(Je).isExpired,
                              })),
                                O(ee, (e(Je), s(() => e(Je).voucherNumber))),
                                O(ke, Ue),
                                O(Ge, (e(Je), s(() => e(Je).issuer))),
                                O(qe, ot),
                                O($, yt),
                                (q = Pt(_, 1, 'status-badge svelte-113vqn2', null, q, {
                                  open: e(Je).status === 'OPEN',
                                  used: e(Je).status === 'USED',
                                  'expired-badge': e(Je).isExpired,
                                })),
                                O(de, (e(Je), s(() => e(Je).status))),
                                (je.disabled = e(u)));
                            },
                            [
                              () => (e(Je), s(() => F(e(Je).type))),
                              () => (
                                e(Je),
                                s(() =>
                                  e(Je).remainingBalance !== void 0
                                    ? `${e(Je).currency} ${parseFloat(e(Je).remainingBalance).toFixed(2)}`
                                    : '—'
                                )
                              ),
                              () => (e(Je), s(() => J(e(Je).expirationDate))),
                            ]
                          ),
                          z('click', Me, () => le(e(Je).id)),
                          z('click', je, () => se(e(Je).id)),
                          p(st, Nt));
                      }
                    ),
                      t(Xe),
                      t(Et),
                      t(Ve),
                      p($e, Ve));
                  };
                S(
                  G,
                  ($e) => {
                    (e(g), s(() => e(g).length === 0) ? $e(U) : $e(pe, !1));
                  },
                  !0
                );
              }
              p(B, Z);
            };
          S(re, (B) => {
            e(u) ? B(ie) : B(ce, !1);
          });
        }
        (t(b), p(d, b));
      },
      P = (d) => {
        var b = he(),
          k = oe(b);
        {
          var W = (ie) => {
              var ce = Gs(),
                B = a(ce),
                Z = r(B, 2);
              (Fr(Z, {
                tripId: '',
                get voucherId() {
                  return e(L);
                },
                get voucher() {
                  return e(ue);
                },
                onSuccess: ye,
                onCancel: ge,
              }),
                t(ce),
                z('click', B, ge),
                p(ie, ce));
            },
            re = (ie) => {
              var ce = he(),
                B = oe(ce);
              {
                var Z = (G) => {
                  var U = Ys(),
                    pe = a(U),
                    $e = r(pe, 2);
                  {
                    let Ve = vt(() => e(L) || '');
                    Fs($e, {
                      get voucherId() {
                        return e(Ve);
                      },
                      get voucher() {
                        return e(ue);
                      },
                      onClose: I,
                      onEdit: xe,
                      onDelete: se,
                    });
                  }
                  (t(U), z('click', pe, I), p(G, U));
                };
                S(
                  B,
                  (G) => {
                    e(R) === 'details' && e(ue) && G(Z);
                  },
                  !0
                );
              }
              p(ie, ce);
            };
          S(
            k,
            (ie) => {
              e(R) === 'form' ? ie(W) : ie(re, !1);
            },
            !0
          );
        }
        p(d, b);
      };
    S(E, (d) => {
      e(R) === 'list' ? d(M) : d(P, !1);
    });
  }
  (t(j), p(i, j), ta());
}
var Ks = w(
    '<div class="loading-state svelte-1srup7e"><span class="material-symbols-outlined">hourglass_empty</span> <p>Loading companions...</p></div>'
  ),
  Xs = w('<span class="indicator svelte-1srup7e">✓</span>'),
  Qs = w('<span class="indicator svelte-1srup7e">✓</span>'),
  eo = w(
    '<button class="action-btn edit-btn svelte-1srup7e" title="Edit companion"><span class="material-symbols-outlined">edit</span></button> <button class="action-btn delete-btn svelte-1srup7e" title="Remove companion"><span class="material-symbols-outlined">delete</span></button>',
    1
  ),
  to = w(
    '<button class="action-btn revoke-btn svelte-1srup7e" title="Revoke access"><span class="material-symbols-outlined">block</span></button>'
  ),
  ao = w(
    '<tr class="svelte-1srup7e"><td class="name-cell svelte-1srup7e"> </td><td class="email-cell svelte-1srup7e"> </td><td class="center-col svelte-1srup7e"><!></td><td class="center-col svelte-1srup7e"><!></td><td class="actions-cell svelte-1srup7e"><div class="actions-group svelte-1srup7e"><!> <!></div></td></tr>'
  ),
  ro = w(
    '<div class="table-wrapper svelte-1srup7e"><table class="companions-table svelte-1srup7e"><thead class="svelte-1srup7e"><tr><th class="svelte-1srup7e">Name</th><th class="svelte-1srup7e">Email</th><th class="center-col svelte-1srup7e">You Invited</th><th class="center-col svelte-1srup7e">They Invited</th><th class="actions-col svelte-1srup7e"></th></tr></thead><tbody class="svelte-1srup7e"></tbody></table></div>'
  ),
  no = w(
    '<div class="empty-state svelte-1srup7e"><span class="material-symbols-outlined">groups</span> <p class="svelte-1srup7e">No companions yet</p> <p class="empty-description svelte-1srup7e">Start adding travel companions to share your trips and collaborate on travel planning.</p></div>'
  ),
  io = w('<div class="settings-companions-container svelte-1srup7e"><!> <!> <!></div>');
function so(i, o) {
  ea(o, !1);
  let c = ne([]),
    f = ne(!0),
    C = ne(null),
    g = ne(null);
  Ga(
    async () => (
      await v(),
      window.addEventListener('companions-updated', u),
      () => {
        window.removeEventListener('companions-updated', u);
      }
    )
  );
  async function u() {
    await v();
  }
  async function v() {
    try {
      (l(f, !0), l(C, null));
      const I = await ya.getAllCompanions();
      (l(c, I.companions || []), console.log('Loaded companions:', e(c)));
    } catch (I) {
      l(C, I instanceof Error ? I.message : 'Failed to load companions');
    } finally {
      l(f, !1);
    }
  }
  async function h(I) {
    try {
      (l(f, !0),
        l(C, null),
        await ya.removeCompanion(I),
        l(g, 'Companion removed successfully'),
        await v(),
        setTimeout(() => {
          l(g, null);
        }, 3e3));
    } catch (se) {
      l(C, se instanceof Error ? se.message : 'Failed to remove companion');
    } finally {
      l(f, !1);
    }
  }
  async function R(I) {
    try {
      (l(f, !0),
        l(C, null),
        await ya.revokeCompanionAccess(I),
        l(g, 'Companion access revoked successfully'),
        await v(),
        setTimeout(() => {
          l(g, null);
        }, 3e3));
    } catch (se) {
      l(C, se instanceof Error ? se.message : 'Failed to revoke access');
    } finally {
      l(f, !1);
    }
  }
  function L(I) {
    return I.firstName && I.lastName
      ? `${I.firstName} ${I.lastName.charAt(0)}.`
      : I.firstName
        ? I.firstName
        : I.lastName
          ? I.lastName
          : I.email;
  }
  function ue(I, se) {
    window.dispatchEvent(new CustomEvent(I, { detail: se }));
  }
  function te(I) {
    ue('edit-companion', { companion: I });
  }
  aa();
  var ve = io(),
    we = a(ve);
  {
    var _e = (I) => {
      Ha(I, {
        type: 'error',
        get message() {
          return e(C);
        },
        dismissible: !0,
      });
    };
    S(we, (I) => {
      e(C) && I(_e);
    });
  }
  var n = r(we, 2);
  {
    var A = (I) => {
      Ha(I, {
        type: 'success',
        get message() {
          return e(g);
        },
        dismissible: !0,
      });
    };
    S(n, (I) => {
      e(g) && I(A);
    });
  }
  var le = r(n, 2);
  {
    var ye = (I) => {
        var se = Ks();
        p(I, se);
      },
      ge = (I) => {
        var se = he(),
          xe = oe(se);
        {
          var J = (j) => {
              var K = ro(),
                X = a(K),
                y = r(a(X));
              (bt(
                y,
                5,
                () => e(c),
                (Q) => Q.id,
                (Q, E) => {
                  var M = ao(),
                    P = a(M),
                    d = a(P, !0);
                  t(P);
                  var b = r(P),
                    k = a(b, !0);
                  t(b);
                  var W = r(b),
                    re = a(W);
                  {
                    var ie = (Xe) => {
                      var st = Xs();
                      p(Xe, st);
                    };
                    S(re, (Xe) => {
                      e(E).youInvited && Xe(ie);
                    });
                  }
                  t(W);
                  var ce = r(W),
                    B = a(ce);
                  {
                    var Z = (Xe) => {
                      var st = Qs();
                      p(Xe, st);
                    };
                    S(B, (Xe) => {
                      e(E).theyInvited && Xe(Z);
                    });
                  }
                  t(ce);
                  var G = r(ce),
                    U = a(G),
                    pe = a(U);
                  {
                    var $e = (Xe) => {
                      var st = eo(),
                        Je = oe(st),
                        Nt = r(Je, 2);
                      (V(() => {
                        ((Je.disabled = e(f)), (Nt.disabled = e(f)));
                      }),
                        z('click', Je, () => te(e(E))),
                        z('click', Nt, () => h(e(E).companionId)),
                        p(Xe, st));
                    };
                    S(pe, (Xe) => {
                      e(E).youInvited && Xe($e);
                    });
                  }
                  var Ve = r(pe, 2);
                  {
                    var Et = (Xe) => {
                      var st = to();
                      (V(() => (st.disabled = e(f))),
                        z('click', st, () => R(e(E).companionId)),
                        p(Xe, st));
                    };
                    S(Ve, (Xe) => {
                      e(E).theyInvited && Xe(Et);
                    });
                  }
                  (t(U),
                    t(G),
                    t(M),
                    V(
                      (Xe) => {
                        (O(d, Xe), O(k, e(E).email));
                      },
                      [() => L(e(E))]
                    ),
                    p(Q, M));
                }
              ),
                t(y),
                t(X),
                t(K),
                p(j, K));
            },
            F = (j) => {
              var K = no();
              p(j, K);
            };
          S(
            xe,
            (j) => {
              e(c) && e(c).length > 0 ? j(J) : j(F, !1);
            },
            !0
          );
        }
        p(I, se);
      };
    S(le, (I) => {
      e(f) ? I(ye) : I(ge, !1);
    });
  }
  (t(ve), p(i, ve), ta());
}
var oo = w('<span class="material-symbols-outlined">download</span> Download Backup', 1),
  lo = w(
    '<div class="selected-file svelte-xh59jx"><span class="material-symbols-outlined">check_circle</span> <div><p class="file-name svelte-xh59jx"> </p> <p class="file-size svelte-xh59jx"> </p></div></div>'
  ),
  co = w(
    '<div class="preview-summary-box svelte-xh59jx"><h4 class="summary-title svelte-xh59jx">Import Summary</h4> <div class="summary-grid svelte-xh59jx"><div><p class="summary-stat svelte-xh59jx"><span class="font-semibold"> </span> total items</p> <p class="summary-subtext svelte-xh59jx"> </p></div></div></div>'
  ),
  vo = w('<span class="section-badge duplicate-badge svelte-xh59jx"> </span>'),
  uo = w(
    '<div class="duplicate-badge-box svelte-xh59jx"><span class="material-symbols-outlined">warning</span> <span> </span></div>'
  ),
  po = w('<p class="item-summary-text svelte-xh59jx"> </p>'),
  mo = w(
    '<div class="duplicate-badge-box svelte-xh59jx"><span class="material-symbols-outlined">warning</span> <span>Duplicate</span></div>'
  ),
  fo = w('<p class="item-summary-text svelte-xh59jx"> </p>'),
  ho = w(
    '<div><!> <div class="item-checkbox-wrapper svelte-xh59jx"><input type="checkbox" class="svelte-xh59jx"/> <label class="item-label svelte-xh59jx"><div class="item-main-content svelte-xh59jx"><span class="item-name-text svelte-xh59jx"> </span> <!></div></label></div></div>'
  ),
  go = w('<div class="trip-children svelte-xh59jx"></div>'),
  _o = w(
    '<div><!> <div class="item-checkbox-wrapper svelte-xh59jx"><input type="checkbox" class="svelte-xh59jx"/> <label class="item-label svelte-xh59jx"><div class="item-main-content svelte-xh59jx"><span class="item-name-text svelte-xh59jx"> </span> <!></div></label></div></div> <!>',
    1
  ),
  yo = w(
    '<div class="section-group svelte-xh59jx"><div class="section-header-bar svelte-xh59jx"><div class="section-header-left svelte-xh59jx"><span class="material-symbols-outlined section-icon svelte-xh59jx"> </span> <h4 class="section-title svelte-xh59jx"> </h4> <span class="section-badge svelte-xh59jx"> </span> <!></div> <label class="section-select-all svelte-xh59jx"><input type="checkbox" class="svelte-xh59jx"/> <span>All</span></label></div> <div class="section-items svelte-xh59jx"></div></div>'
  ),
  bo = w('<span class="material-symbols-outlined">check</span> Import Selected', 1),
  xo = w('<span class="material-symbols-outlined">arrow_back</span> Back', 1),
  To = w(
    '<div class="preview-section svelte-xh59jx"><!> <div class="preview-lists svelte-xh59jx"></div> <div class="preview-actions svelte-xh59jx"><!> <!></div></div>'
  ),
  Do = w(
    '<div class="settings-backup-container svelte-xh59jx"><!> <!> <div class="export-section svelte-xh59jx"><div class="section-header svelte-xh59jx"><div class="icon-box export svelte-xh59jx"><span class="material-symbols-outlined">download</span></div> <h3 class="svelte-xh59jx">Export Data</h3></div> <!></div> <div class="import-section svelte-xh59jx"><div class="section-header svelte-xh59jx"><div class="icon-box import svelte-xh59jx"><span class="material-symbols-outlined">upload</span></div> <h3 class="svelte-xh59jx">Import Data</h3></div> <div class="file-input-wrapper svelte-xh59jx"><input type="file" accept=".json" id="file-input" class="svelte-xh59jx"/> <label for="file-input" class="file-label svelte-xh59jx"><span class="material-symbols-outlined">description</span> <span>Choose JSON File</span></label></div> <!></div> <!></div>'
  );
function wo(i, o) {
  ea(o, !1);
  let c = ne(!1),
    f = ne(null),
    C = ne(null),
    g = ne(null),
    u = ne(null),
    v = ne(!1),
    h = ne({}),
    R = ne(!1);
  async function L() {
    try {
      (l(c, !0), l(f, null));
      const E = await ya.exportData(),
        M = window.URL.createObjectURL(E),
        P = document.createElement('a');
      ((P.href = M),
        (P.download = `bluebonnet-backup-${new Date().toISOString().split('T')[0]}.json`),
        document.body.appendChild(P),
        P.click(),
        document.body.removeChild(P),
        window.URL.revokeObjectURL(M),
        l(C, 'Data exported successfully'),
        setTimeout(() => {
          l(C, null);
        }, 3e3));
    } catch (E) {
      l(f, E instanceof Error ? E.message : 'Failed to export data');
    } finally {
      l(c, !1);
    }
  }
  async function ue(E) {
    const P = E.target.files;
    if (!P || P.length === 0) return;
    const d = P[0];
    if (d.type !== 'application/json') {
      l(f, 'Please select a valid JSON file');
      return;
    }
    (l(g, d), l(f, null), await te(d));
  }
  async function te(E) {
    const M = E || e(g);
    if (!M) {
      l(f, 'Please select a file');
      return;
    }
    try {
      (l(v, !0), l(f, null));
      const P = await ya.previewImport(M),
        d = P.data || P;
      (l(u, d.preview || d),
        l(h, {}),
        e(u).items &&
          Array.isArray(e(u).items) &&
          e(u).items.forEach((b) => {
            Y(h, (e(h)[b.id] = b.selected !== !1));
          }));
    } catch (P) {
      l(f, P instanceof Error ? P.message : 'Failed to preview import');
    } finally {
      l(v, !1);
    }
  }
  async function ve() {
    if (e(u))
      try {
        (l(R, !0), l(f, null));
        const E = Object.entries(e(h))
          .filter(([, k]) => k)
          .map(([k]) => k);
        if (E.length === 0) {
          l(f, 'Please select items to import');
          return;
        }
        const M = {
            trips: [],
            standaloneFlights: [],
            standaloneHotels: [],
            standaloneTransportation: [],
            standaloneCarRentals: [],
            standaloneEvents: [],
            vouchers: [],
            companions: [],
          },
          P = {},
          d = new Set(E);
        if (e(u).items && Array.isArray(e(u).items)) {
          for (const k of e(u).items)
            if (d.has(k.id))
              if (k.type === 'trip')
                ((P[k.originalId] = {
                  ...k.data,
                  flights: [],
                  hotels: [],
                  transportation: [],
                  carRentals: [],
                  events: [],
                }),
                  M.trips.push(P[k.originalId]));
              else if (k.type === 'flight')
                if (k.parentTripId) {
                  const W = e(u).items.find((re) => re.id === k.parentTripId);
                  W && P[W.originalId] && P[W.originalId].flights.push(k.data);
                } else M.standaloneFlights.push(k.data);
              else if (k.type === 'hotel')
                if (k.parentTripId) {
                  const W = e(u).items.find((re) => re.id === k.parentTripId);
                  W && P[W.originalId] && P[W.originalId].hotels.push(k.data);
                } else M.standaloneHotels.push(k.data);
              else if (k.type === 'transportation')
                if (k.parentTripId) {
                  const W = e(u).items.find((re) => re.id === k.parentTripId);
                  W && P[W.originalId] && P[W.originalId].transportation.push(k.data);
                } else M.standaloneTransportation.push(k.data);
              else if (k.type === 'carRental')
                if (k.parentTripId) {
                  const W = e(u).items.find((re) => re.id === k.parentTripId);
                  W && P[W.originalId] && P[W.originalId].carRentals.push(k.data);
                } else M.standaloneCarRentals.push(k.data);
              else if (k.type === 'event')
                if (k.parentTripId) {
                  const W = e(u).items.find((re) => re.id === k.parentTripId);
                  W && P[W.originalId] && P[W.originalId].events.push(k.data);
                } else M.standaloneEvents.push(k.data);
              else
                k.type === 'voucher'
                  ? M.vouchers.push(k.data)
                  : k.type === 'companion' && M.companions.push(k.data);
        }
        const b = await ya.importData({ importData: M, selectedItemIds: E });
        b &&
          b.success &&
          (l(
            C,
            `Successfully imported ${b.stats ? Object.values(b.stats).reduce((k, W) => k + (typeof W == 'number' ? W : 0), 0) : E.length} items`
          ),
          l(g, null),
          l(u, null),
          l(h, {}),
          typeof window < 'u' &&
            window.dispatchEvent(new CustomEvent('dataImported', { detail: { stats: b.stats } })),
          setTimeout(() => {
            l(C, null);
          }, 5e3));
      } catch (E) {
        l(f, E instanceof Error ? E.message : 'Failed to import data');
      } finally {
        l(R, !1);
      }
  }
  function we(E, M, P) {
    (M.map((b) => b.id).forEach((b) => {
      Y(h, (e(h)[b] = P));
    }),
      l(h, { ...e(h) }));
  }
  function _e(E, M) {
    (Y(h, (e(h)[E] = M)), l(h, { ...e(h) }));
  }
  function n(E, M) {
    if ((Y(h, (e(h)[E] = M)), M)) {
      const P = e(u).items.find((d) => d.id === E);
      P &&
        P.children &&
        ['flights', 'hotels', 'transportation', 'carRentals', 'events'].forEach((d) => {
          P.children[d] &&
            P.children[d].length > 0 &&
            P.children[d].forEach((b) => {
              Y(h, (e(h)[b] = !0));
            });
        });
    }
    l(h, { ...e(h) });
  }
  aa();
  var A = Do(),
    le = a(A);
  {
    var ye = (E) => {
      Ha(E, {
        type: 'error',
        get message() {
          return e(f);
        },
        dismissible: !0,
      });
    };
    S(le, (E) => {
      e(f) && E(ye);
    });
  }
  var ge = r(le, 2);
  {
    var I = (E) => {
      Ha(E, {
        type: 'success',
        get message() {
          return e(C);
        },
        dismissible: !0,
      });
    };
    S(ge, (E) => {
      e(C) && E(I);
    });
  }
  var se = r(ge, 2),
    xe = r(a(se), 2);
  (Ua(xe, {
    variant: 'primary',
    get disabled() {
      return e(c);
    },
    get loading() {
      return e(c);
    },
    $$events: { click: L },
    children: (E, M) => {
      var P = oo();
      (Wt(), p(E, P));
    },
    $$slots: { default: !0 },
  }),
    t(se));
  var J = r(se, 2),
    F = r(a(J), 2),
    j = a(F);
  (Wt(2), t(F));
  var K = r(F, 2);
  {
    var X = (E) => {
      var M = lo(),
        P = r(a(M), 2),
        d = a(P),
        b = a(d, !0);
      t(d);
      var k = r(d, 2),
        W = a(k);
      (t(k),
        t(P),
        t(M),
        V(
          (re) => {
            (O(b, e(g).name), O(W, `${re ?? ''} KB`));
          },
          [() => (e(g).size / 1024).toFixed(2)]
        ),
        p(E, M));
    };
    S(K, (E) => {
      e(g) && E(X);
    });
  }
  t(J);
  var y = r(J, 2);
  {
    var Q = (E) => {
      var M = To(),
        P = a(M);
      {
        var d = (ie) => {
          var ce = co(),
            B = r(a(ce), 2),
            Z = a(B),
            G = a(Z),
            U = a(G),
            pe = a(U, !0);
          (t(U), Wt(), t(G));
          var $e = r(G, 2),
            Ve = a($e);
          (t($e),
            t(Z),
            t(B),
            t(ce),
            V(() => {
              (O(pe, e(u).stats.totalItems),
                O(Ve, `${e(u).stats.totalDuplicates ?? ''} possible duplicates`));
            }),
            p(ie, ce));
        };
        S(P, (ie) => {
          e(u).stats && ie(d);
        });
      }
      var b = r(P, 2);
      (bt(
        b,
        4,
        () => [
          { key: 'trips', label: 'Trips', icon: 'luggage' },
          { key: 'standaloneFlights', label: 'Standalone Flights', icon: 'flight' },
          { key: 'standaloneHotels', label: 'Standalone Hotels', icon: 'apartment' },
          {
            key: 'standaloneTransportation',
            label: 'Standalone Transportation',
            icon: 'local_taxi',
          },
          { key: 'standaloneCarRentals', label: 'Standalone Car Rentals', icon: 'directions_car' },
          { key: 'standaloneEvents', label: 'Standalone Events', icon: 'event' },
          { key: 'vouchers', label: 'Vouchers & Credits', icon: 'card_giftcard' },
          { key: 'companions', label: 'Travel Companions', icon: 'person_add' },
        ],
        ha,
        (ie, ce) => {
          const B = vt(() => e(u).items.filter((pe) => pe.category === ce.key));
          var Z = he(),
            G = oe(Z);
          {
            var U = (pe) => {
              const $e = vt(() => e(B).filter((qe) => qe.isDuplicate).length);
              var Ve = yo(),
                Et = a(Ve),
                Xe = a(Et),
                st = a(Xe),
                Je = a(st, !0);
              t(st);
              var Nt = r(st, 2),
                Mt = a(Nt, !0);
              t(Nt);
              var N = r(Nt, 2),
                ee = a(N);
              t(N);
              var ae = r(N, 2);
              {
                var ke = (qe) => {
                  var m = vo(),
                    $ = a(m);
                  (t(m), V(() => O($, `${e($e) ?? ''} duplicates`)), p(qe, m));
                };
                S(ae, (qe) => {
                  e($e) > 0 && qe(ke);
                });
              }
              t(Xe);
              var ze = r(Xe, 2),
                Ge = a(ze);
              (fe(Ge), Wt(2), t(ze), t(Et));
              var Dt = r(Et, 2);
              (bt(
                Dt,
                5,
                () => e(B),
                (qe) => qe.id,
                (qe, m) => {
                  var $ = _o(),
                    T = oe($);
                  let _;
                  var q = a(T);
                  {
                    var de = (He) => {
                      var be = uo(),
                        Le = r(a(be), 2),
                        We = a(Le);
                      (t(Le),
                        t(be),
                        V(() => O(We, `Possible duplicate: ${e(m).duplicateOf.name ?? ''}`)),
                        p(He, be));
                    };
                    S(q, (He) => {
                      e(m).isDuplicate && e(m).duplicateOf && He(de);
                    });
                  }
                  var Ie = r(q, 2),
                    Me = a(Ie);
                  fe(Me);
                  var je = r(Me, 2),
                    Ue = a(je),
                    ot = a(Ue),
                    yt = a(ot, !0);
                  t(ot);
                  var tt = r(ot, 2);
                  {
                    var Qe = (He) => {
                      var be = po(),
                        Le = a(be, !0);
                      (t(be), V(() => O(Le, e(m).summary)), p(He, be));
                    };
                    S(tt, (He) => {
                      e(m).summary && He(Qe);
                    });
                  }
                  (t(Ue), t(je), t(Ie), t(T));
                  var et = r(T, 2);
                  {
                    var ut = (He) => {
                      var be = go();
                      (bt(
                        be,
                        4,
                        () => ['flights', 'hotels', 'transportation', 'carRentals', 'events'],
                        ha,
                        (Le, We) => {
                          var xt = he(),
                            x = oe(xt);
                          {
                            var pt = (Fe) => {
                              var lt = he(),
                                Te = oe(lt);
                              (bt(
                                Te,
                                1,
                                () => e(m).children[We],
                                ha,
                                (rt, Pe) => {
                                  const De = vt(() => e(u).items.find((ft) => ft.id === e(Pe)));
                                  var Be = he(),
                                    Ce = oe(Be);
                                  {
                                    var mt = (ft) => {
                                      var Oe = ho();
                                      let Ne;
                                      var nt = a(Oe);
                                      {
                                        var _t = (Ke) => {
                                          var it = mo();
                                          p(Ke, it);
                                        };
                                        S(nt, (Ke) => {
                                          e(De).isDuplicate && e(De).duplicateOf && Ke(_t);
                                        });
                                      }
                                      var St = r(nt, 2),
                                        Ee = a(St);
                                      fe(Ee);
                                      var dt = r(Ee, 2),
                                        qt = a(dt),
                                        Ut = a(qt),
                                        at = a(Ut, !0);
                                      t(Ut);
                                      var D = r(Ut, 2);
                                      {
                                        var wt = (Ke) => {
                                          var it = fo(),
                                            ht = a(it, !0);
                                          (t(it), V(() => O(ht, e(De).summary)), p(Ke, it));
                                        };
                                        S(D, (Ke) => {
                                          e(De).summary && Ke(wt);
                                        });
                                      }
                                      (t(qt),
                                        t(dt),
                                        t(St),
                                        t(Oe),
                                        V(() => {
                                          ((Ne = Pt(
                                            Oe,
                                            1,
                                            'item-card item-card-nested svelte-xh59jx',
                                            null,
                                            Ne,
                                            { duplicate: e(De).isDuplicate }
                                          )),
                                            Ye(Ee, 'id', `item-${e(De).id ?? ''}`),
                                            Cr(Ee, e(h)[e(De).id] || !1),
                                            (Ee.disabled = e(R)),
                                            Ye(dt, 'for', `item-${e(De).id ?? ''}`),
                                            O(at, e(De).name));
                                        }),
                                        z('change', Ee, (Ke) => {
                                          _e(e(De).id, Ke.target.checked);
                                        }),
                                        p(ft, Oe));
                                    };
                                    S(Ce, (ft) => {
                                      e(De) && ft(mt);
                                    });
                                  }
                                  p(rt, Be);
                                }
                              ),
                                p(Fe, lt));
                            };
                            S(x, (Fe) => {
                              e(m).children[We] && e(m).children[We].length > 0 && Fe(pt);
                            });
                          }
                          p(Le, xt);
                        }
                      ),
                        t(be),
                        p(He, be));
                    };
                    S(et, (He) => {
                      ce.key === 'trips' && e(m).children && He(ut);
                    });
                  }
                  (V(() => {
                    ((_ = Pt(T, 1, 'item-card svelte-xh59jx', null, _, {
                      duplicate: e(m).isDuplicate,
                    })),
                      Ye(Me, 'id', `item-${e(m).id ?? ''}`),
                      Cr(Me, e(h)[e(m).id] || !1),
                      (Me.disabled = e(R)),
                      Ye(je, 'for', `item-${e(m).id ?? ''}`),
                      O(yt, e(m).name));
                  }),
                    z('change', Me, (He) => {
                      ce.key === 'trips'
                        ? n(e(m).id, He.target.checked)
                        : _e(e(m).id, He.target.checked);
                    }),
                    p(qe, $));
                }
              ),
                t(Dt),
                t(Ve),
                V(
                  (qe) => {
                    (O(Je, ce.icon),
                      O(Mt, ce.label),
                      O(ee, `${e(B).length ?? ''} items`),
                      Cr(Ge, qe),
                      (Ge.disabled = e(R)));
                  },
                  [() => e(B).every((qe) => e(h)[qe.id])]
                ),
                z('change', Ge, (qe) => we(ce.key, e(B), qe.target.checked)),
                p(pe, Ve));
            };
            S(G, (pe) => {
              e(B).length > 0 && pe(U);
            });
          }
          p(ie, Z);
        }
      ),
        t(b));
      var k = r(b, 2),
        W = a(k);
      {
        let ie = vt(() => Object.values(e(h)).every((ce) => !ce) || e(R));
        Ua(W, {
          variant: 'primary',
          get disabled() {
            return e(ie);
          },
          get loading() {
            return e(R);
          },
          $$events: { click: ve },
          children: (ce, B) => {
            var Z = bo();
            (Wt(), p(ce, Z));
          },
          $$slots: { default: !0 },
        });
      }
      var re = r(W, 2);
      (Ua(re, {
        variant: 'secondary',
        get disabled() {
          return e(R);
        },
        $$events: {
          click: () => {
            (l(u, null), l(h, {}));
          },
        },
        children: (ie, ce) => {
          var B = xo();
          (Wt(), p(ie, B));
        },
        $$slots: { default: !0 },
      }),
        t(k),
        t(M),
        p(E, M));
    };
    S(y, (E) => {
      e(u) && e(u).items && e(u).items.length > 0 && E(Q);
    });
  }
  (t(A), V(() => (j.disabled = e(v) || e(R))), z('change', j, ue), p(i, A), ta());
}
var Co = w('<div class="error-message"> </div>'),
  ko = w('<p class="help-text svelte-mv3v44">Email cannot be changed</p>'),
  Eo = w(
    '<div class="edit-content"><!> <form><div class="form-fields"><div class="form-row cols-2-1"><div class="form-group"><label for="firstName">First Name</label> <input id="firstName" type="text" placeholder="John"/></div> <div class="form-group"><label for="lastName">Last Initial</label> <input id="lastName" type="text" placeholder="D" maxlength="1"/></div></div> <div class="form-group"><label for="email">Email Address *</label> <input id="email" type="email" placeholder="companion@example.com" required/> <!></div> <div class="checkbox-wrapper svelte-mv3v44"><label for="can-edit" class="checkbox-label svelte-mv3v44"><input id="can-edit" type="checkbox" class="svelte-mv3v44"/> Allow editing of trip items</label> <p class="checkbox-help-text svelte-mv3v44">If unchecked, companion can only view your trips</p></div></div> <div class="form-buttons"><button class="submit-btn" type="submit"> </button> <button class="cancel-btn" type="button">Cancel</button></div></form></div>'
  );
function Yr(i, o) {
  ea(o, !1);
  let c = Ae(o, 'companion', 8, null),
    f = Ae(o, 'onSuccess', 8, null),
    C = Ae(o, 'onCancel', 8, null),
    g = ne(!1),
    u = ne(null),
    v = ne({ firstName: '', lastName: '', email: '', canEdit: !1 });
  const h = !!c()?.id;
  async function R() {
    try {
      if ((l(u, null), !e(v).email.trim())) {
        l(u, 'Email is required');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e(v).email)) {
        l(u, 'Please enter a valid email address');
        return;
      }
      if (h && (e(v).firstName || e(v).lastName) && (!e(v).firstName || !e(v).lastName)) {
        l(u, 'Please provide both first name and last name, or neither');
        return;
      }
      l(g, !0);
      const M = {
        firstName: e(v).firstName || void 0,
        lastName: e(v).lastName || void 0,
        email: e(v).email,
        canBeAddedByOthers: e(v).canEdit,
      };
      let P;
      h ? (P = await ya.updateCompanion(c().id, M)) : (P = await ya.createCompanion(M));
      const d = P.data || P.companion || P;
      f() && f()(d);
    } catch (M) {
      l(
        u,
        M instanceof Error
          ? M.message
          : h
            ? 'Failed to update companion'
            : 'Failed to add companion'
      );
    } finally {
      l(g, !1);
    }
  }
  function L() {
    C() && C()();
  }
  (fa(
    () => Se(c()),
    () => {
      c() &&
        l(v, {
          firstName: c().firstName || '',
          lastName: c().lastName || '',
          email: c().email || '',
          canEdit: c().canBeAddedByOthers || !1,
        });
    }
  ),
    sr(),
    aa());
  var ue = Eo(),
    te = a(ue);
  {
    var ve = (M) => {
      var P = Co(),
        d = a(P, !0);
      (t(P), V(() => O(d, e(u))), p(M, P));
    };
    S(te, (M) => {
      e(u) && M(ve);
    });
  }
  var we = r(te, 2),
    _e = a(we),
    n = a(_e),
    A = a(n),
    le = r(a(A), 2);
  (fe(le), t(A));
  var ye = r(A, 2),
    ge = r(a(ye), 2);
  (fe(ge), t(ye), t(n));
  var I = r(n, 2),
    se = r(a(I), 2);
  fe(se);
  var xe = r(se, 2);
  {
    var J = (M) => {
      var P = ko();
      p(M, P);
    };
    S(xe, (M) => {
      h && M(J);
    });
  }
  t(I);
  var F = r(I, 2),
    j = a(F),
    K = a(j);
  (fe(K), Wt(), t(j), Wt(2), t(F), t(_e));
  var X = r(_e, 2),
    y = a(X),
    Q = a(y, !0);
  t(y);
  var E = r(y, 2);
  (t(X),
    t(we),
    t(ue),
    V(() => {
      ((le.disabled = e(g)),
        (ge.disabled = e(g)),
        (se.disabled = e(g) || h),
        (K.disabled = e(g)),
        (y.disabled = e(g)),
        O(Q, h ? 'Update' : 'Add Companion'),
        (E.disabled = e(g)));
    }),
    me(
      le,
      () => e(v).firstName,
      (M) => Y(v, (e(v).firstName = M))
    ),
    me(
      ge,
      () => e(v).lastName,
      (M) => Y(v, (e(v).lastName = M))
    ),
    me(
      se,
      () => e(v).email,
      (M) => Y(v, (e(v).email = M))
    ),
    nn(
      K,
      () => e(v).canEdit,
      (M) => Y(v, (e(v).canEdit = M))
    ),
    z('click', E, L),
    z('submit', we, xr(R)),
    p(i, ue),
    ta());
}
var jo = w('<div class="companion-circle svelte-1xpgi64"> </div>'),
  No = w('<div class="companion-indicators svelte-1xpgi64"></div>');
function ur(i, o) {
  ea(o, !1);
  let c = Ae(o, 'companions', 24, () => []);
  function f(u, v) {
    if (!u) return '?';
    if (v) {
      const h = v.trim().split(' ');
      return h.length >= 2 ? (h[0][0] + h[h.length - 1][0]).toUpperCase() : h[0][0].toUpperCase();
    }
    return u.substring(0, 2).toUpperCase();
  }
  function C(u) {
    const v = [
        '#FF6B6B',
        '#4ECDC4',
        '#45B7D1',
        '#FFA07A',
        '#98D8C8',
        '#F7DC6F',
        '#BB8FCE',
        '#85C1E2',
        '#F8B88B',
        '#A9CCE3',
      ],
      h = u.charCodeAt(0);
    return v[h % v.length];
  }
  aa();
  var g = No();
  (bt(
    g,
    5,
    c,
    (u) => u.id,
    (u, v) => {
      var h = jo(),
        R = a(h, !0);
      (t(h),
        V(
          (L, ue, te) => {
            (Lr(h, `border-color: ${L ?? ''}; color: ${ue ?? ''}`),
              Ye(h, 'title', (e(v), s(() => e(v).email))),
              O(R, te));
          },
          [
            () => (e(v), s(() => C(f(e(v).email, e(v).name)))),
            () => (e(v), s(() => C(f(e(v).email, e(v).name)))),
            () => (e(v), s(() => f(e(v).email, e(v).name))),
          ]
        ),
        p(u, h));
    }
  ),
    t(g),
    p(i, g),
    ta());
}
var So = w(
    '<div class="settings-main-panel svelte-x1i5gj"><div class="settings-main-content svelte-x1i5gj"><div class="settings-section svelte-x1i5gj"><h3 class="svelte-x1i5gj">Account</h3> <button class="settings-item svelte-x1i5gj"><span class="material-symbols-outlined svelte-x1i5gj">person</span> <span class="svelte-x1i5gj">Profile</span></button> <button class="settings-item svelte-x1i5gj"><span class="material-symbols-outlined svelte-x1i5gj">lock</span> <span class="svelte-x1i5gj">Security</span></button></div> <div class="settings-section svelte-x1i5gj"><h3 class="svelte-x1i5gj">Manage Vouchers & Credits</h3> <button class="settings-item svelte-x1i5gj"><span class="material-symbols-outlined svelte-x1i5gj">card_giftcard</span> <span class="svelte-x1i5gj">Vouchers & Credits</span></button></div> <div class="settings-section svelte-x1i5gj"><h3 class="svelte-x1i5gj">Manage Travel Companions</h3> <button class="settings-item svelte-x1i5gj"><span class="material-symbols-outlined svelte-x1i5gj">people</span> <span class="svelte-x1i5gj">Travel Companions</span></button></div> <div class="settings-section svelte-x1i5gj"><h3 class="svelte-x1i5gj">Data</h3> <button class="settings-item svelte-x1i5gj"><span class="material-symbols-outlined svelte-x1i5gj">cloud_download</span> <span class="svelte-x1i5gj">Backup & Export</span></button></div> <div class="settings-section svelte-x1i5gj"><h3 class="svelte-x1i5gj">Account Actions</h3> <a href="/logout" class="settings-item logout svelte-x1i5gj"><span class="material-symbols-outlined svelte-x1i5gj">logout</span> <span class="svelte-x1i5gj">Sign Out</span></a></div></div></div>'
  ),
  Io = w(
    '<div class="empty-state svelte-x1i5gj"><span class="material-symbols-outlined empty-icon svelte-x1i5gj">calendar_month</span> <p> </p> <!></div>'
  ),
  Mo = w('<p class="trip-cities svelte-x1i5gj"> </p>'),
  $o = w('<div class="trip-companions svelte-x1i5gj"><!></div>'),
  Ao = w('<span class="date-header-layover svelte-x1i5gj"> </span>'),
  qo = w('<span class="date-header-layover svelte-x1i5gj"> </span>'),
  Po = w('<div class="item-companions svelte-x1i5gj"><!></div>'),
  Ro = w(
    '<div class="layover-indicator svelte-x1i5gj"><p class="layover-text svelte-x1i5gj"> </p></div>'
  ),
  Lo = w(
    '<div role="button" tabindex="0"><div class="flight-icon-wrapper svelte-x1i5gj"><p class="flight-time-label svelte-x1i5gj"> </p> <div class="item-icon blue svelte-x1i5gj"><span class="material-symbols-outlined" style="font-size: 1.3rem;">flight</span></div></div> <div class="item-content svelte-x1i5gj"><p class="item-title svelte-x1i5gj"> </p> <p class="item-route svelte-x1i5gj"> </p></div> <!></div>  <!>',
    1
  ),
  Fo = w('<div class="item-companions svelte-x1i5gj"><!></div>'),
  Oo = w(
    '<div role="button" tabindex="0"><div class="item-icon green svelte-x1i5gj"><span class="material-symbols-outlined" style="font-size: 1.3rem;">hotel</span></div> <div class="item-content svelte-x1i5gj"><p class="item-title svelte-x1i5gj"> </p> <p class="item-dates svelte-x1i5gj"> </p> <p class="item-route svelte-x1i5gj"> </p></div> <!></div>'
  ),
  zo = w(
    '<div class="standalone-item-card svelte-x1i5gj" role="button" tabindex="0"><div class="flight-icon-wrapper svelte-x1i5gj"><p class="flight-time-label svelte-x1i5gj"> </p> <div class="item-icon red svelte-x1i5gj"><span class="material-symbols-outlined" style="font-size: 1.3rem;"> </span></div></div> <div class="item-content svelte-x1i5gj"><p class="item-title svelte-x1i5gj"> </p> <p class="item-route svelte-x1i5gj"> </p></div></div>'
  ),
  Uo = w(
    '<div class="standalone-item-card svelte-x1i5gj" role="button" tabindex="0"><div class="item-icon gray svelte-x1i5gj"><span class="material-symbols-outlined" style="font-size: 1.3rem;">directions_car</span></div> <div class="item-content svelte-x1i5gj"><p class="item-title svelte-x1i5gj"> </p> <p class="item-time svelte-x1i5gj"> </p> <p class="item-route svelte-x1i5gj"> </p></div></div>'
  ),
  Ho = w(
    '<div class="item-icon purple svelte-x1i5gj"><span class="material-symbols-outlined" style="font-size: 1.3rem;">event</span></div>'
  ),
  Bo = w(
    '<div class="flight-icon-wrapper svelte-x1i5gj"><p class="flight-time-label svelte-x1i5gj"> </p> <div class="item-icon purple svelte-x1i5gj"><span class="material-symbols-outlined" style="font-size: 1.3rem;">event</span></div></div>'
  ),
  Vo = w('<div class="item-companions svelte-x1i5gj"><!></div>'),
  Jo = w(
    '<div class="standalone-item-card svelte-x1i5gj" role="button" tabindex="0"><!> <div class="item-content svelte-x1i5gj"><p class="item-title svelte-x1i5gj"> </p> <p class="item-time svelte-x1i5gj"> </p> <p class="item-route svelte-x1i5gj"> </p></div> <!></div>'
  ),
  Go = w(
    '<div class="trip-item-date-group svelte-x1i5gj"><div class="trip-item-date-header svelte-x1i5gj"><span class="trip-date-badge svelte-x1i5gj"> </span> <div class="date-header-layovers svelte-x1i5gj"><!></div></div> <div class="trip-item-date-items svelte-x1i5gj"></div></div>'
  ),
  Yo = w('<div class="trip-items svelte-x1i5gj"></div>'),
  Wo = w(
    '<div><div class="trip-header svelte-x1i5gj" role="button" tabindex="0"><div class="trip-icon-container svelte-x1i5gj"><span class="material-symbols-outlined trip-icon svelte-x1i5gj"> </span></div> <div class="trip-info svelte-x1i5gj"><div class="trip-name-row svelte-x1i5gj"><h3 class="trip-name svelte-x1i5gj"> </h3> <button class="edit-btn svelte-x1i5gj" title="Edit trip details and companions"><span class="material-symbols-outlined">edit</span></button></div> <p class="trip-dates svelte-x1i5gj"> </p> <!></div> <button><span class="material-symbols-outlined">expand_more</span></button></div> <!> <!></div>'
  ),
  Zo = w('<p class="item-dates svelte-x1i5gj"> </p>'),
  Ko = w('<p class="item-time svelte-x1i5gj"><!></p>'),
  Xo = w('<div class="item-companions svelte-x1i5gj"><!></div>'),
  Qo = w(
    '<div class="standalone-item-card svelte-x1i5gj" role="button" tabindex="0"><div><span class="material-symbols-outlined"> </span></div> <div class="item-content svelte-x1i5gj"><p class="item-title svelte-x1i5gj"> </p> <!> <p class="item-route svelte-x1i5gj"><!></p></div> <!></div>'
  ),
  el = w(
    '<div class="timeline-date-group svelte-x1i5gj"><div class="timeline-date-header svelte-x1i5gj"><span class="date-badge svelte-x1i5gj"> </span></div> <div class="timeline-items svelte-x1i5gj"></div></div>'
  ),
  tl = w('<div class="trips-list svelte-x1i5gj"></div>'),
  al = w(
    '<div slot="primary" class="primary-content svelte-x1i5gj"><div class="header-section svelte-x1i5gj"><div class="header-top svelte-x1i5gj"><h1 class="svelte-x1i5gj">My Trips</h1> <div class="header-buttons svelte-x1i5gj"><button class="icon-btn svelte-x1i5gj" title="View calendar"><span class="material-symbols-outlined">calendar_month</span></button> <button class="add-btn svelte-x1i5gj" title="Add new trip"><span class="material-symbols-outlined">add</span></button></div></div> <!> <nav class="tabs svelte-x1i5gj"><div class="tabs-left svelte-x1i5gj"><button>Upcoming</button> <button>Past</button></div> <button title="Settings"><span class="material-symbols-outlined" style="font-size: 1.1rem;">settings</span></button></nav></div> <div class="trips-content svelte-x1i5gj"><!></div></div>'
  ),
  rl = w(
    '<div class="calendar-sidebar-container svelte-x1i5gj"><div class="calendar-sidebar-header svelte-x1i5gj"><h2 class="svelte-x1i5gj">Calendar</h2> <button class="close-btn svelte-x1i5gj" title="Close"><span class="material-symbols-outlined">close</span></button></div> <!></div>'
  ),
  nl = w(
    '<div class="settings-panel svelte-x1i5gj"><div class="settings-panel-header svelte-x1i5gj"><h2 class="svelte-x1i5gj">Profile</h2> <button class="close-btn svelte-x1i5gj" title="Close"><span class="material-symbols-outlined">close</span></button></div> <div class="settings-panel-content svelte-x1i5gj"><!></div></div>'
  ),
  il = w(
    '<div class="settings-panel svelte-x1i5gj"><div class="settings-panel-header svelte-x1i5gj"><h2 class="svelte-x1i5gj">Security</h2> <button class="close-btn svelte-x1i5gj" title="Close"><span class="material-symbols-outlined">close</span></button></div> <div class="settings-panel-content svelte-x1i5gj"><!></div></div>'
  ),
  sl = w(
    '<div class="calendar-sidebar-container svelte-x1i5gj"><div class="calendar-sidebar-header svelte-x1i5gj"><h2 class="svelte-x1i5gj">Vouchers & Credits</h2> <button class="close-btn svelte-x1i5gj" title="Close"><span class="material-symbols-outlined">close</span></button></div> <!></div>'
  ),
  ol = w(
    '<div class="calendar-sidebar-container svelte-x1i5gj"><div class="calendar-sidebar-header svelte-x1i5gj"><h2 class="svelte-x1i5gj">Travel Companions</h2> <div class="header-actions svelte-x1i5gj"><button class="add-companion-btn svelte-x1i5gj" title="Add Companion"><span class="material-symbols-outlined">group_add</span></button> <button class="close-btn svelte-x1i5gj" title="Close"><span class="material-symbols-outlined">close</span></button></div></div> <!></div>'
  ),
  ll = w(
    '<div class="calendar-sidebar-container svelte-x1i5gj"><div class="calendar-sidebar-header svelte-x1i5gj"><h2 class="svelte-x1i5gj">Backup & Export</h2> <button class="close-btn svelte-x1i5gj" title="Close"><span class="material-symbols-outlined">close</span></button></div> <!></div>'
  ),
  dl = w(
    '<div class="new-item-menu svelte-x1i5gj"><div class="menu-header svelte-x1i5gj"><h2 class="menu-title svelte-x1i5gj">Add New Item</h2> <button class="close-menu-btn svelte-x1i5gj" title="Close"><span class="material-symbols-outlined">close</span></button></div> <div class="menu-items svelte-x1i5gj"><button class="menu-item svelte-x1i5gj"><div class="menu-item-icon amber svelte-x1i5gj"><span class="material-symbols-outlined">flight</span></div> <div class="menu-item-content svelte-x1i5gj"><h3 class="svelte-x1i5gj">Trip</h3> <p class="svelte-x1i5gj">Plan a complete trip with dates</p></div> <span class="material-symbols-outlined menu-arrow svelte-x1i5gj">chevron_right</span></button> <div class="menu-divider svelte-x1i5gj"><span class="svelte-x1i5gj">or add a single item</span></div> <button class="menu-item svelte-x1i5gj"><div class="menu-item-icon blue svelte-x1i5gj"><span class="material-symbols-outlined">flight</span></div> <div class="menu-item-content svelte-x1i5gj"><h3 class="svelte-x1i5gj">Flight</h3> <p class="svelte-x1i5gj">Add a flight booking</p></div> <span class="material-symbols-outlined menu-arrow svelte-x1i5gj">chevron_right</span></button> <button class="menu-item svelte-x1i5gj"><div class="menu-item-icon green svelte-x1i5gj"><span class="material-symbols-outlined">hotel</span></div> <div class="menu-item-content svelte-x1i5gj"><h3 class="svelte-x1i5gj">Hotel</h3> <p class="svelte-x1i5gj">Add a hotel or accommodation</p></div> <span class="material-symbols-outlined menu-arrow svelte-x1i5gj">chevron_right</span></button> <button class="menu-item svelte-x1i5gj"><div class="menu-item-icon red svelte-x1i5gj"><span class="material-symbols-outlined">train</span></div> <div class="menu-item-content svelte-x1i5gj"><h3 class="svelte-x1i5gj">Transportation</h3> <p class="svelte-x1i5gj">Train, bus, taxi, or other transit</p></div> <span class="material-symbols-outlined menu-arrow svelte-x1i5gj">chevron_right</span></button> <button class="menu-item svelte-x1i5gj"><div class="menu-item-icon gray svelte-x1i5gj"><span class="material-symbols-outlined">directions_car</span></div> <div class="menu-item-content svelte-x1i5gj"><h3 class="svelte-x1i5gj">Car Rental</h3> <p class="svelte-x1i5gj">Add a car rental booking</p></div> <span class="material-symbols-outlined menu-arrow svelte-x1i5gj">chevron_right</span></button> <button class="menu-item svelte-x1i5gj"><div class="menu-item-icon purple svelte-x1i5gj"><span class="material-symbols-outlined">event</span></div> <div class="menu-item-content svelte-x1i5gj"><h3 class="svelte-x1i5gj">Event</h3> <p class="svelte-x1i5gj">Concert, conference, or activity</p></div> <span class="material-symbols-outlined menu-arrow svelte-x1i5gj">chevron_right</span></button></div></div>'
  ),
  cl = w('<div slot="secondary"><!></div>'),
  vl = w(
    '<div class="tertiary-header svelte-x1i5gj"><h3 class="svelte-x1i5gj">Edit Voucher</h3> <button class="close-btn svelte-x1i5gj" title="Close"><span class="material-symbols-outlined">close</span></button></div> <div class="tertiary-form-container svelte-x1i5gj"><!></div>',
    1
  ),
  ul = w(
    '<div class="tertiary-header svelte-x1i5gj"><h3 class="svelte-x1i5gj">Add Voucher</h3> <button class="close-btn svelte-x1i5gj" title="Close"><span class="material-symbols-outlined">close</span></button></div> <div class="tertiary-form-container svelte-x1i5gj"><!></div>',
    1
  ),
  pl = w(
    '<div class="tertiary-header svelte-x1i5gj"><h3 class="svelte-x1i5gj">Add Companion</h3> <button class="close-btn svelte-x1i5gj" title="Close"><span class="material-symbols-outlined">close</span></button></div> <div class="tertiary-form-container svelte-x1i5gj"><!></div>',
    1
  ),
  ml = w(
    '<div class="tertiary-header svelte-x1i5gj"><h3 class="svelte-x1i5gj">Edit Companion</h3> <button class="close-btn svelte-x1i5gj" title="Close"><span class="material-symbols-outlined">close</span></button></div> <div class="tertiary-form-container svelte-x1i5gj"><!></div>',
    1
  ),
  fl = w('<div slot="tertiary" class="tertiary-content svelte-x1i5gj"><!></div>');
function Ml(i, o) {
  ea(o, !1);
  const c = () => Fn(zn, '$authStore', f),
    [f, C] = Ln();
  let g = ne([]),
    u = ne({ flights: [], hotels: [], transportation: [], carRentals: [], events: [] }),
    v = ne([]),
    h = ne('upcoming'),
    R = ne('trips'),
    L = ne(!0),
    ue = ne(null),
    te = ne(new Set()),
    ve = ne({ flights: [], hotels: [], events: [], transportation: [], carRentals: [] }),
    we = ne(null),
    _e = ne(null),
    n = ne(null),
    A = ne(null),
    le = ne(null),
    ye = ne({}),
    ge = ne([]);
  function I(m) {
    let $,
      T = null;
    if (
      (m.type === 'trip'
        ? ($ = j(m.data.departureDate))
        : (($ = m.sortDate),
          m.itemType === 'flight'
            ? (T = m.data.originTimezone)
            : m.itemType === 'hotel'
              ? (T = m.data.timezone)
              : m.itemType === 'transportation'
                ? (T = m.data.originTimezone)
                : m.itemType === 'carRental'
                  ? (T = m.data.pickupTimezone)
                  : m.itemType === 'event' && (T = m.data.timezone)),
      T)
    )
      try {
        const Ie = new Intl.DateTimeFormat('en-CA', {
            year: 'numeric',
            month: '2-digit',
            timeZone: T,
          }).formatToParts($),
          Me = {};
        return (
          Ie.forEach((je) => {
            je.type !== 'literal' && (Me[je.type] = je.value);
          }),
          `${Me.year}-${Me.month}`
        );
      } catch {}
    const _ = $.getUTCFullYear(),
      q = String($.getUTCMonth() + 1).padStart(2, '0');
    return `${_}-${q}`;
  }
  async function se() {
    try {
      const m = await ir.getAll('all'),
        $ = m?.trips || [];
      (l(
        u,
        m?.standalone || { flights: [], hotels: [], transportation: [], carRentals: [], events: [] }
      ),
        console.log('[Dashboard] Loaded standalone items:', {
          flights: e(u).flights?.length || 0,
          hotels: e(u).hotels?.length || 0,
          transportation: e(u).transportation?.length || 0,
          carRentals: e(u).carRentals?.length || 0,
          events: e(u).events?.length || 0,
          fullStandalone: e(u),
        }));
      const T = await Promise.all(
        $.map(async (_) => {
          try {
            return await ir.getOne(_.id);
          } catch (q) {
            return (console.error('Error fetching trip details:', q), _);
          }
        })
      );
      (T.forEach((_) => {
        (console.log(`[Dashboard] Trip ${_.id} (${_.name}):`, {
          flightCount: _.flights?.length || 0,
          hotelCount: _.hotels?.length || 0,
          eventCount: _.events?.length || 0,
          travelCompanions: _.travelCompanions,
          travelCompanionCount: _.travelCompanions?.length || 0,
        }),
          _.flights &&
            _.flights.length > 0 &&
            _.flights.forEach((q) => {
              const de = q.itemCompanions?.length || 0;
              console.log(`  - Flight ${q.id}: ${de} companions`);
            }),
          _.events &&
            _.events.length > 0 &&
            _.events.forEach((q) => {
              const de = q.itemCompanions?.length || 0;
              console.log(`  - Event ${q.id}: ${de} companions`);
            }));
      }),
        Xn.setTrips(T),
        l(g, T),
        y(),
        Q());
    } catch (m) {
      const $ = m instanceof Error ? m.message : 'Failed to load trips';
      l(ue, $);
    } finally {
      l(L, !1);
    }
  }
  function xe() {
    se();
  }
  function J() {
    U('add-companion', {});
  }
  function F(m) {
    const $ = m.detail?.companion;
    $ && U('edit-companion', { companion: $ });
  }
  Ga(
    async () => (
      await se(),
      window.addEventListener('dataImported', xe),
      window.addEventListener('add-companion', J),
      window.addEventListener('edit-companion', F),
      () => {
        (window.removeEventListener('dataImported', xe),
          window.removeEventListener('add-companion', J),
          window.removeEventListener('edit-companion', F));
      }
    )
  );
  function j(m) {
    if (!m) return new Date(0);
    const [$, T, _] = m.split('-').map(Number);
    return new Date($, T - 1, _, 0, 0, 0, 0);
  }
  function K(m) {
    return m.returnDate ? j(m.returnDate) : m.departureDate ? j(m.departureDate) : new Date(0);
  }
  function X(m, $) {
    return $ === 'flight'
      ? new Date(m.departureDateTime)
      : $ === 'hotel'
        ? new Date(m.checkInDateTime)
        : $ === 'transportation'
          ? new Date(m.departureDateTime)
          : $ === 'carRental'
            ? new Date(m.pickupDateTime)
            : $ === 'event'
              ? new Date(m.startDateTime)
              : new Date(0);
  }
  function y() {
    const m = new Date();
    m.setHours(0, 0, 0, 0);
    const $ = [];
    (e(g).forEach((T) => {
      $.push({
        type: 'trip',
        data: T,
        sortDate: T.departureDate ? j(T.departureDate) : new Date(0),
      });
    }),
      ['flights', 'hotels', 'transportation', 'carRentals', 'events'].forEach((T) => {
        const _ = {
          flights: 'flight',
          hotels: 'hotel',
          transportation: 'transportation',
          carRentals: 'carRental',
          events: 'event',
        };
        e(u)[T] &&
          e(u)[T].forEach((q) => {
            (q.itemCompanions &&
              console.log(
                `[Dashboard] Standalone ${_[T]} ${q.id} has ${q.itemCompanions.length} companions:`,
                q.itemCompanions
              ),
              $.push({ type: 'standalone', itemType: _[T], data: q, sortDate: X(q, _[T]) }));
          });
      }),
      e(h) === 'upcoming'
        ? (l(
            v,
            $.filter((T) => {
              if (T.type === 'trip') {
                const _ = T.data.departureDate ? j(T.data.departureDate) : null;
                return _ && _ >= m;
              } else return T.sortDate >= m;
            })
          ),
          e(v).sort((T, _) => T.sortDate.getTime() - _.sortDate.getTime()))
        : e(h) === 'past' &&
          (l(
            v,
            $.filter((T) => (T.type === 'trip' ? K(T.data) < m : T.sortDate < m))
          ),
          e(v).sort((T, _) => _.sortDate.getTime() - T.sortDate.getTime())));
  }
  function Q() {
    const m = { flights: [], hotels: [], events: [], transportation: [], carRentals: [] };
    (e(v).forEach(($) => {
      if ($.type === 'trip') {
        const T = $.data;
        (T.flights &&
          (T.flights.forEach((_) => {
            _.itemCompanions &&
              console.log(
                `[Dashboard] Trip flight ${_.id} has ${_.itemCompanions.length} companions:`,
                _.itemCompanions
              );
          }),
          m.flights.push(...T.flights.map((_) => ({ ..._, tripId: T.id })))),
          T.hotels &&
            (T.hotels.forEach((_) => {
              _.itemCompanions &&
                console.log(
                  `[Dashboard] Trip hotel ${_.id} has ${_.itemCompanions.length} companions:`,
                  _.itemCompanions
                );
            }),
            m.hotels.push(...T.hotels.map((_) => ({ ..._, tripId: T.id })))),
          T.events &&
            (T.events.forEach((_) => {
              _.itemCompanions &&
                console.log(
                  `[Dashboard] Trip event ${_.id} has ${_.itemCompanions.length} companions:`,
                  _.itemCompanions
                );
            }),
            m.events.push(...T.events.map((_) => ({ ..._, tripId: T.id })))),
          T.transportation &&
            m.transportation.push(...T.transportation.map((_) => ({ ..._, tripId: T.id }))),
          T.carRentals && m.carRentals.push(...T.carRentals.map((_) => ({ ..._, tripId: T.id }))));
      } else
        $.type === 'standalone' &&
          ($.itemType === 'flight'
            ? m.flights.push($.data)
            : $.itemType === 'hotel'
              ? m.hotels.push($.data)
              : $.itemType === 'event'
                ? m.events.push($.data)
                : $.itemType === 'transportation'
                  ? m.transportation.push($.data)
                  : $.itemType === 'carRental' && m.carRentals.push($.data));
    }),
      l(ve, m));
  }
  function E(m) {
    (l(h, m), G(), y(), Q());
  }
  function M() {
    l(A, { type: 'newItemMenu', data: {} });
  }
  function P() {
    (l(A, { type: 'calendar', data: {} }), d());
  }
  function d() {
    setTimeout(() => {
      const m = document.getElementById('secondary-sidebar');
      m &&
        (e(A)?.type === 'calendar'
          ? m.classList.add('full-width')
          : m.classList.remove('full-width'));
    }, 0);
  }
  function b() {
    l(A, { type: 'trip', itemType: 'trip', data: {} });
  }
  function k(m) {
    l(A, { type: m, itemType: m, data: {} });
  }
  function W(m) {
    (e(te).has(m) ? e(te).delete(m) : e(te).add(m), l(te, e(te)));
  }
  function re(m) {
    l(we, m);
  }
  function ie() {
    l(we, null);
  }
  function ce(m, $) {
    (l(n, m), l(_e, $));
  }
  function B() {
    (l(_e, null), l(n, null));
  }
  function Z(m, $, T) {
    (console.log('[Dashboard] handleItemClick:', {
      type: m,
      itemType: $,
      itemId: T?.id,
      hasItemCompanions: !!T?.itemCompanions,
      companionCount: T?.itemCompanions?.length || 0,
      itemCompanions: T?.itemCompanions,
    }),
      l(A, { type: m, itemType: $ || void 0, data: T }));
  }
  function G() {
    (l(A, null), d());
  }
  function U(m, $ = {}) {
    l(le, { type: m, data: $ });
  }
  function pe() {
    l(le, null);
  }
  function $e(m) {
    if (!m) return '';
    const $ = j(m),
      T = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      _ = String($.getDate()).padStart(2, '0'),
      q = T[$.getMonth()],
      de = $.getFullYear();
    return `${_} ${q} ${de}`;
  }
  function Ve(m) {
    if (!m) return '';
    const [$, T] = m.split('-'),
      _ = parseInt($, 10),
      q = parseInt(T, 10);
    return `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][q - 1]} ${_}`;
  }
  function Et(m) {
    if (!m) return '';
    const [$, T, _] = m.split('-'),
      q = parseInt($, 10),
      de = parseInt(T, 10) - 1,
      Ie = parseInt(_, 10),
      je = new Date(q, de, Ie).toLocaleDateString('en-US', { weekday: 'short' }),
      ot = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][de];
    return `${je}, ${Ie} ${ot}`;
  }
  function Xe(m) {
    let $,
      T = null;
    if (m.type === 'flight') (($ = new Date(m.departureDateTime)), (T = m.originTimezone));
    else if (m.type === 'hotel') (($ = new Date(m.checkInDateTime)), (T = m.timezone));
    else if (m.type === 'transportation')
      (($ = new Date(m.departureDateTime)), (T = m.originTimezone));
    else if (m.type === 'carRental') (($ = new Date(m.pickupDateTime)), (T = m.pickupTimezone));
    else if (m.type === 'event') (($ = new Date(m.startDateTime)), (T = m.timezone));
    else return '';
    if (T)
      try {
        const Me = new Intl.DateTimeFormat('en-CA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: T,
          }).formatToParts($),
          je = {};
        return (
          Me.forEach((Ue) => {
            Ue.type !== 'literal' && (je[Ue.type] = Ue.value);
          }),
          `${je.year}-${je.month}-${je.day}`
        );
      } catch {}
    const _ = $.getUTCFullYear(),
      q = String($.getUTCMonth() + 1).padStart(2, '0'),
      de = String($.getUTCDate()).padStart(2, '0');
    return `${_}-${q}-${de}`;
  }
  function st(m) {
    const $ = {},
      T = [];
    return (
      m.flights &&
        m.flights.forEach((_) => {
          const q = { type: 'flight', ..._ };
          (_.itemCompanions &&
            _.itemCompanions.length > 0 &&
            console.log(
              `[groupTripItemsByDate] Flight ${_.id} had ${_.itemCompanions.length} companions, now has ${q.itemCompanions?.length || 0}`
            ),
            T.push(q));
        }),
      m.hotels &&
        m.hotels.forEach((_) => {
          const q = { type: 'hotel', ..._ };
          (_.itemCompanions &&
            _.itemCompanions.length > 0 &&
            console.log(
              `[groupTripItemsByDate] Hotel ${_.id} had ${_.itemCompanions.length} companions, now has ${q.itemCompanions?.length || 0}`
            ),
            T.push(q));
        }),
      m.transportation &&
        m.transportation.forEach((_) => {
          const q = { type: 'transportation', ..._ };
          T.push(q);
        }),
      m.carRentals &&
        m.carRentals.forEach((_) => {
          const q = { type: 'carRental', ..._ };
          T.push(q);
        }),
      m.events &&
        m.events.forEach((_) => {
          const q = { type: 'event', ..._ };
          (_.itemCompanions &&
            _.itemCompanions.length > 0 &&
            console.log(
              `[groupTripItemsByDate] Event ${_.id} had ${_.itemCompanions.length} companions, now has ${q.itemCompanions?.length || 0}`
            ),
            T.push(q));
        }),
      T.sort((_, q) => {
        const de =
            _.type === 'flight'
              ? new Date(_.departureDateTime)
              : _.type === 'hotel'
                ? new Date(_.checkInDateTime)
                : _.type === 'transportation'
                  ? new Date(_.departureDateTime)
                  : _.type === 'carRental'
                    ? new Date(_.pickupDateTime)
                    : _.type === 'event'
                      ? new Date(_.startDateTime)
                      : new Date(0),
          Ie =
            q.type === 'flight'
              ? new Date(q.departureDateTime)
              : q.type === 'hotel'
                ? new Date(q.checkInDateTime)
                : q.type === 'transportation'
                  ? new Date(q.departureDateTime)
                  : q.type === 'carRental'
                    ? new Date(q.pickupDateTime)
                    : q.type === 'event'
                      ? new Date(q.startDateTime)
                      : new Date(0);
        return de.getTime() - Ie.getTime();
      }),
      T.forEach((_) => {
        const q = Xe(_);
        ($[q] || ($[q] = []), $[q].push(_));
      }),
      $
    );
  }
  function Je(m) {
    return m ? m.charAt(0).toUpperCase() + m.slice(1).toLowerCase() : '';
  }
  function Nt(m, $ = null) {
    if (!m) return '';
    const T = new Date(m);
    if (!$) {
      const q = String(T.getUTCHours()).padStart(2, '0'),
        de = String(T.getUTCMinutes()).padStart(2, '0');
      return `${q}:${de}`;
    }
    return new Intl.DateTimeFormat('en-US', {
      timeZone: $,
      hour: '2-digit',
      minute: '2-digit',
      hour12: !1,
    }).format(T);
  }
  function Mt(m, $ = null) {
    if (!m) return '';
    const T = new Date(m);
    if (!$) {
      const _ = String(T.getUTCHours()).padStart(2, '0'),
        q = String(T.getUTCMinutes()).padStart(2, '0'),
        de = String(T.getUTCDate()).padStart(2, '0'),
        Me = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
          T.getUTCMonth()
        ],
        je = T.getUTCFullYear();
      return `${de} ${Me} ${je} ${_}:${q}`;
    }
    try {
      const q = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: !1,
          timeZone: $,
        }).formatToParts(T),
        de = {};
      return (
        q.forEach((Ie) => {
          Ie.type !== 'literal' && (de[Ie.type] = Ie.value);
        }),
        `${de.day} ${de.month} ${de.year} ${de.hour}:${de.minute}`
      );
    } catch {
      const q = String(T.getUTCHours()).padStart(2, '0'),
        de = String(T.getUTCMinutes()).padStart(2, '0'),
        Ie = String(T.getUTCDate()).padStart(2, '0'),
        je = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
          T.getUTCMonth()
        ],
        Ue = T.getUTCFullYear();
      return `${Ie} ${je} ${Ue} ${q}:${de}`;
    }
  }
  function N(m, $ = null) {
    if (!m) return '';
    const T = new Date(m);
    if (!$) {
      const _ = String(T.getUTCDate()).padStart(2, '0'),
        de = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
          T.getUTCMonth()
        ],
        Ie = T.getUTCFullYear();
      return `${_} ${de} ${Ie}`;
    }
    try {
      const q = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          timeZone: $,
        }).formatToParts(T),
        de = {};
      return (
        q.forEach((Ie) => {
          Ie.type !== 'literal' && (de[Ie.type] = Ie.value);
        }),
        `${de.day} ${de.month} ${de.year}`
      );
    } catch {
      const q = String(T.getUTCDate()).padStart(2, '0'),
        Ie = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
          T.getUTCMonth()
        ],
        Me = T.getUTCFullYear();
      return `${q} ${Ie} ${Me}`;
    }
  }
  function ee(m) {
    if (!m) return '';
    if (m.includes(' - ')) {
      const $ = m.split(' - ')[1];
      return $ && $.includes(',') ? $.split(',')[0].trim() : $?.trim() || '';
    }
    return m.includes(',') ? m.split(',')[0].trim() : m.trim();
  }
  function ae(m) {
    const $ = (m || '').toLowerCase().trim();
    return (
      {
        train: 'train',
        bus: 'directions_bus',
        ferry: 'directions_boat',
        shuttle: 'local_taxi',
        taxi: 'local_taxi',
        rideshare: 'local_taxi',
        subway: 'subway',
        metro: 'subway',
        tram: 'tram',
        other: 'directions_run',
      }[$] || 'train'
    );
  }
  function ke(m) {
    return m === 'business'
      ? 'badge'
      : ['leisure', 'family', 'romantic'].includes(m)
        ? 'hotel'
        : 'flights_and_hotels';
  }
  function ze(m) {
    const $ = new Set();
    return (
      m.flights &&
        m.flights.forEach((T) => {
          (T.origin && $.add(ee(T.origin)), T.destination && $.add(ee(T.destination)));
        }),
      m.transportation &&
        m.transportation.forEach((T) => {
          (T.origin && $.add(ee(T.origin)), T.destination && $.add(ee(T.destination)));
        }),
      m.carRentals &&
        m.carRentals.forEach((T) => {
          T.pickupLocation && $.add(ee(T.pickupLocation));
        }),
      Array.from($).sort().join(', ')
    );
  }
  function Ge(m, $) {
    if (m.type !== 'flight' || $.type !== 'flight') return null;
    const T = m.destination?.split(' - ')[0]?.trim(),
      _ = $.origin?.split(' - ')[0]?.trim();
    if (!T || !_ || T !== _) return null;
    const q = new Date(m.arrivalDateTime),
      Me = (new Date($.departureDateTime).getTime() - q.getTime()) / (1e3 * 60 * 60);
    if (Me < 0 || Me >= 24) return null;
    const je = Math.floor(Me),
      Ue = Math.round((Me - je) * 60);
    return { duration: je > 0 ? `${je}h ${Ue}m` : `${Ue}m`, location: T };
  }
  function Dt(m, $) {
    const T = [];
    (m.flights &&
      m.flights.forEach((_) => {
        T.push({ type: 'flight', ..._ });
      }),
      m.hotels &&
        m.hotels.forEach((_) => {
          T.push({ type: 'hotel', ..._ });
        }),
      m.transportation &&
        m.transportation.forEach((_) => {
          T.push({ type: 'transportation', ..._ });
        }),
      m.carRentals &&
        m.carRentals.forEach((_) => {
          T.push({ type: 'carRental', ..._ });
        }),
      m.events &&
        m.events.forEach((_) => {
          T.push({ type: 'event', ..._ });
        }),
      T.sort((_, q) => {
        const de =
            _.type === 'flight'
              ? new Date(_.departureDateTime)
              : _.type === 'hotel'
                ? new Date(_.checkInDateTime)
                : _.type === 'transportation'
                  ? new Date(_.departureDateTime)
                  : _.type === 'carRental'
                    ? new Date(_.pickupDateTime)
                    : _.type === 'event'
                      ? new Date(_.startDateTime)
                      : new Date(0),
          Ie =
            q.type === 'flight'
              ? new Date(q.departureDateTime)
              : q.type === 'hotel'
                ? new Date(q.checkInDateTime)
                : q.type === 'transportation'
                  ? new Date(q.departureDateTime)
                  : q.type === 'carRental'
                    ? new Date(q.pickupDateTime)
                    : q.type === 'event'
                      ? new Date(q.startDateTime)
                      : new Date(0);
        return de.getTime() - Ie.getTime();
      }));
    for (let _ = 0; _ < T.length; _++)
      if (T[_].type === 'flight' && T[_].id === $) {
        if (_ + 1 < T.length && T[_ + 1].type === 'flight') return Ge(T[_], T[_ + 1]);
        break;
      }
    return null;
  }
  function qe(m, $, T) {
    const _ = [];
    (m.flights &&
      m.flights.forEach((q) => {
        _.push({ type: 'flight', ...q });
      }),
      m.hotels &&
        m.hotels.forEach((q) => {
          _.push({ type: 'hotel', ...q });
        }),
      m.transportation &&
        m.transportation.forEach((q) => {
          _.push({ type: 'transportation', ...q });
        }),
      m.carRentals &&
        m.carRentals.forEach((q) => {
          _.push({ type: 'carRental', ...q });
        }),
      m.events &&
        m.events.forEach((q) => {
          _.push({ type: 'event', ...q });
        }),
      _.sort((q, de) => {
        const Ie =
            q.type === 'flight'
              ? new Date(q.departureDateTime)
              : q.type === 'hotel'
                ? new Date(q.checkInDateTime)
                : q.type === 'transportation'
                  ? new Date(q.departureDateTime)
                  : q.type === 'carRental'
                    ? new Date(q.pickupDateTime)
                    : q.type === 'event'
                      ? new Date(q.startDateTime)
                      : new Date(0),
          Me =
            de.type === 'flight'
              ? new Date(de.departureDateTime)
              : de.type === 'hotel'
                ? new Date(de.checkInDateTime)
                : de.type === 'transportation'
                  ? new Date(de.departureDateTime)
                  : de.type === 'carRental'
                    ? new Date(de.pickupDateTime)
                    : de.type === 'event'
                      ? new Date(de.startDateTime)
                      : new Date(0);
        return Ie.getTime() - Me.getTime();
      }));
    for (let q = 0; q < _.length; q++)
      if (_[q].type === 'flight' && _[q].id === $) {
        if (q + 1 < _.length && _[q + 1].type === 'flight') return Xe(_[q + 1]) !== T;
        break;
      }
    return !1;
  }
  (fa(
    () => (e(v), e(ye), e(ge)),
    () => {
      e(v).length > 0
        ? (l(ye, {}),
          l(ge, []),
          e(v).forEach((m) => {
            const $ = I(m);
            (e(ye)[$] || (Y(ye, (e(ye)[$] = [])), e(ge).push($)), e(ye)[$].push(m));
          }))
        : (l(ye, {}), l(ge, []));
    }
  ),
    fa(
      () => (e(A), e(le)),
      () => {
        if (typeof window < 'u' && e(A)) {
          const m = document.getElementById('secondary-sidebar');
          m &&
            (['calendar', 'settings-vouchers', 'settings-companions', 'settings-backup'].includes(
              e(A).type
            )
              ? m.classList.add('full-width')
              : m.classList.remove('full-width'),
            e(le) ? m.classList.add('with-tertiary') : m.classList.remove('with-tertiary'));
        }
      }
    ),
    sr(),
    aa(),
    mn('x1i5gj', (m) => {
      tn(() => {
        Pn.title = 'Dashboard - Bluebonnet';
      });
    }));
  {
    let m = vt(() => e(h) === 'past');
    Kn(i, {
      get tripData() {
        return e(ve);
      },
      get isPast() {
        return e(m);
      },
      get highlightedTripId() {
        return e(we);
      },
      get highlightedItemType() {
        return e(n);
      },
      get highlightedItemId() {
        return e(_e);
      },
      $$slots: {
        primary: ($, T) => {
          var _ = al(),
            q = a(_),
            de = a(q),
            Ie = r(a(de), 2),
            Me = a(Ie),
            je = r(Me, 2);
          (t(Ie), t(de));
          var Ue = r(de, 2);
          {
            var ot = (Fe) => {
              Ha(Fe, {
                type: 'error',
                get message() {
                  return e(ue);
                },
                dismissible: !0,
              });
            };
            S(Ue, (Fe) => {
              e(ue) && Fe(ot);
            });
          }
          var yt = r(Ue, 2),
            tt = a(yt),
            Qe = a(tt);
          let et;
          var ut = r(Qe, 2);
          let He;
          t(tt);
          var be = r(tt, 2);
          let Le;
          (t(yt), t(q));
          var We = r(q, 2),
            xt = a(We);
          {
            var x = (Fe) => {
                var lt = So(),
                  Te = a(lt),
                  rt = a(Te),
                  Pe = r(a(rt), 2),
                  De = r(Pe, 2);
                t(rt);
                var Be = r(rt, 2),
                  Ce = r(a(Be), 2);
                t(Be);
                var mt = r(Be, 2),
                  ft = r(a(mt), 2);
                t(mt);
                var Oe = r(mt, 2),
                  Ne = r(a(Oe), 2);
                (t(Oe),
                  Wt(2),
                  t(Te),
                  t(lt),
                  z('click', Pe, () => {
                    l(A, { type: 'settings-profile', data: c().user || {} });
                  }),
                  z('click', De, () => {
                    l(A, { type: 'settings-security', data: {} });
                  }),
                  z('click', Ce, () => {
                    l(A, { type: 'settings-vouchers', data: {} });
                  }),
                  z('click', ft, () => {
                    l(A, { type: 'settings-companions', data: {} });
                  }),
                  z('click', Ne, () => {
                    l(A, { type: 'settings-backup', data: {} });
                  }),
                  p(Fe, lt));
              },
              pt = (Fe) => {
                var lt = he(),
                  Te = oe(lt);
                {
                  var rt = (De) => {
                      ni(De, { message: 'Loading trips...' });
                    },
                    Pe = (De) => {
                      var Be = he(),
                        Ce = oe(Be);
                      {
                        var mt = (Oe) => {
                            var Ne = Io(),
                              nt = r(a(Ne), 2),
                              _t = a(nt, !0);
                            t(nt);
                            var St = r(nt, 2);
                            (Ua(St, {
                              variant: 'primary',
                              size: 'small',
                              $$events: { click: M },
                              children: (Ee, dt) => {
                                Wt();
                                var qt = Ca('Create Trip');
                                p(Ee, qt);
                              },
                              $$slots: { default: !0 },
                            }),
                              t(Ne),
                              V(() =>
                                O(_t, e(h) === 'upcoming' ? 'No upcoming trips' : 'No past trips')
                              ),
                              p(Oe, Ne));
                          },
                          ft = (Oe) => {
                            var Ne = tl();
                            (bt(
                              Ne,
                              5,
                              () => e(ge),
                              (nt) => nt,
                              (nt, _t) => {
                                var St = el(),
                                  Ee = a(St),
                                  dt = a(Ee),
                                  qt = a(dt, !0);
                                (t(dt), t(Ee));
                                var Ut = r(Ee, 2);
                                (bt(
                                  Ut,
                                  5,
                                  () => (e(ye), e(_t), s(() => e(ye)[e(_t)])),
                                  (at) =>
                                    at.type === 'trip'
                                      ? at.data.id
                                      : `${at.itemType}-${at.data.id}`,
                                  (at, D) => {
                                    var wt = he(),
                                      Ke = oe(wt);
                                    {
                                      var it = (Re) => {
                                          var ct = Wo();
                                          let Ct;
                                          var Bt = a(ct),
                                            Ht = a(Bt),
                                            Vt = a(Ht),
                                            ba = a(Vt, !0);
                                          (t(Vt), t(Ht));
                                          var $a = r(Ht, 2),
                                            Da = a($a),
                                            ra = a(Da),
                                            Gt = a(ra, !0);
                                          t(ra);
                                          var Ya = r(ra, 2);
                                          t(Da);
                                          var Wa = r(Da, 2),
                                            or = a(Wa);
                                          t(Wa);
                                          var lr = r(Wa, 2);
                                          {
                                            var Sa = (gt) => {
                                              var $t = Mo(),
                                                Zt = a($t, !0);
                                              (t($t),
                                                V(
                                                  (Rt) => O(Zt, Rt),
                                                  [() => (e(D), s(() => ze(e(D).data)))]
                                                ),
                                                p(gt, $t));
                                            };
                                            S(lr, (gt) => {
                                              (e(D), s(() => ze(e(D).data)) && gt(Sa));
                                            });
                                          }
                                          t($a);
                                          var na = r($a, 2);
                                          let kt;
                                          t(Bt);
                                          var It = r(Bt, 2);
                                          {
                                            var ka = (gt) => {
                                              var $t = $o(),
                                                Zt = a($t);
                                              {
                                                let Rt = vt(
                                                  () => (
                                                    e(D),
                                                    s(() =>
                                                      e(D).data.tripCompanions.map(
                                                        (Ea) => Ea.companion
                                                      )
                                                    )
                                                  )
                                                );
                                                ur(Zt, {
                                                  get companions() {
                                                    return e(Rt);
                                                  },
                                                });
                                              }
                                              (t($t), p(gt, $t));
                                            };
                                            S(It, (gt) => {
                                              (e(D),
                                                s(
                                                  () =>
                                                    e(D).data.tripCompanions &&
                                                    e(D).data.tripCompanions.length > 0
                                                ) && gt(ka));
                                            });
                                          }
                                          var Aa = r(It, 2);
                                          {
                                            var Za = (gt) => {
                                              var $t = Yo();
                                              (bt(
                                                $t,
                                                5,
                                                () => (e(D), s(() => Object.keys(st(e(D).data)))),
                                                (Zt) => Zt,
                                                (Zt, Rt) => {
                                                  var Ea = Go(),
                                                    Kt = a(Ea),
                                                    va = a(Kt),
                                                    qa = a(va, !0);
                                                  t(va);
                                                  var Ba = r(va, 2),
                                                    dr = a(Ba);
                                                  {
                                                    var ua = (ia) => {
                                                        const H = vt(
                                                          () => (
                                                            e(D),
                                                            s(() => Object.keys(st(e(D).data)))
                                                          )
                                                        );
                                                        var pa = he(),
                                                          Va = oe(pa);
                                                        {
                                                          var cr = (Ka) => {
                                                            const sa = vt(
                                                              () => (
                                                                Se(e(H)),
                                                                e(Rt),
                                                                s(
                                                                  () =>
                                                                    e(H)[e(H).indexOf(e(Rt)) - 1]
                                                                )
                                                              )
                                                            );
                                                            var oa = he(),
                                                              Xa = oe(oa);
                                                            {
                                                              var Pa = (la) => {
                                                                const Ta = vt(
                                                                  () => (
                                                                    e(D),
                                                                    Se(e(sa)),
                                                                    s(() => st(e(D).data)[e(sa)])
                                                                  )
                                                                );
                                                                var At = he(),
                                                                  wa = oe(At);
                                                                (bt(
                                                                  wa,
                                                                  1,
                                                                  () => e(Ta),
                                                                  ha,
                                                                  (ja, Yt) => {
                                                                    var Jt = he(),
                                                                      Lt = oe(Jt);
                                                                    {
                                                                      var ga = (Xt) => {
                                                                        const ma = vt(
                                                                            () => (
                                                                              e(D),
                                                                              e(Yt),
                                                                              s(() =>
                                                                                Dt(
                                                                                  e(D).data,
                                                                                  e(Yt).id
                                                                                )
                                                                              )
                                                                            )
                                                                          ),
                                                                          Qt = vt(
                                                                            () => (
                                                                              e(D),
                                                                              e(Yt),
                                                                              Se(e(sa)),
                                                                              s(() =>
                                                                                qe(
                                                                                  e(D).data,
                                                                                  e(Yt).id,
                                                                                  e(sa)
                                                                                )
                                                                              )
                                                                            )
                                                                          );
                                                                        var Ft = he(),
                                                                          Ot = oe(Ft);
                                                                        {
                                                                          var Tt = (jt) => {
                                                                            var zt = Ao(),
                                                                              Na = a(zt);
                                                                            (t(zt),
                                                                              V(() =>
                                                                                O(
                                                                                  Na,
                                                                                  `${(Se(e(ma)), s(() => e(ma).duration) ?? '')} in ${(Se(e(ma)), s(() => e(ma).location) ?? '')}`
                                                                                )
                                                                              ),
                                                                              p(jt, zt));
                                                                          };
                                                                          S(Ot, (jt) => {
                                                                            e(ma) &&
                                                                              e(Qt) &&
                                                                              jt(Tt);
                                                                          });
                                                                        }
                                                                        p(Xt, Ft);
                                                                      };
                                                                      S(Lt, (Xt) => {
                                                                        (e(Yt),
                                                                          s(
                                                                            () =>
                                                                              e(Yt).type ===
                                                                              'flight'
                                                                          ) && Xt(ga));
                                                                      });
                                                                    }
                                                                    p(ja, Jt);
                                                                  }
                                                                ),
                                                                  p(la, At));
                                                              };
                                                              S(Xa, (la) => {
                                                                e(sa) && la(Pa);
                                                              });
                                                            }
                                                            p(Ka, oa);
                                                          };
                                                          S(Va, (Ka) => {
                                                            (Se(e(H)),
                                                              s(() => e(H).length > 1) && Ka(cr));
                                                          });
                                                        }
                                                        p(ia, pa);
                                                      },
                                                      xa = (ia) => {
                                                        const H = vt(
                                                            () => (
                                                              e(D),
                                                              s(() => Object.keys(st(e(D).data)))
                                                            )
                                                          ),
                                                          pa = vt(
                                                            () => (
                                                              Se(e(H)),
                                                              e(Rt),
                                                              s(() => e(H).indexOf(e(Rt)))
                                                            )
                                                          );
                                                        var Va = he(),
                                                          cr = oe(Va);
                                                        {
                                                          var Ka = (sa) => {
                                                            const oa = vt(
                                                                () => (
                                                                  Se(e(H)),
                                                                  Se(e(pa)),
                                                                  s(() => e(H)[e(pa) - 1])
                                                                )
                                                              ),
                                                              Xa = vt(
                                                                () => (
                                                                  e(D),
                                                                  Se(e(oa)),
                                                                  s(() => st(e(D).data)[e(oa)])
                                                                )
                                                              );
                                                            var Pa = he(),
                                                              la = oe(Pa);
                                                            (bt(
                                                              la,
                                                              1,
                                                              () => e(Xa),
                                                              ha,
                                                              (Ta, At) => {
                                                                var wa = he(),
                                                                  ja = oe(wa);
                                                                {
                                                                  var Yt = (Jt) => {
                                                                    const Lt = vt(
                                                                        () => (
                                                                          e(D),
                                                                          e(At),
                                                                          s(() =>
                                                                            Dt(e(D).data, e(At).id)
                                                                          )
                                                                        )
                                                                      ),
                                                                      ga = vt(
                                                                        () => (
                                                                          e(D),
                                                                          e(At),
                                                                          Se(e(oa)),
                                                                          s(() =>
                                                                            qe(
                                                                              e(D).data,
                                                                              e(At).id,
                                                                              e(oa)
                                                                            )
                                                                          )
                                                                        )
                                                                      );
                                                                    var Xt = he(),
                                                                      ma = oe(Xt);
                                                                    {
                                                                      var Qt = (Ft) => {
                                                                        var Ot = qo(),
                                                                          Tt = a(Ot);
                                                                        (t(Ot),
                                                                          V(() =>
                                                                            O(
                                                                              Tt,
                                                                              `${(Se(e(Lt)), s(() => e(Lt).duration) ?? '')} in ${(Se(e(Lt)), s(() => e(Lt).location) ?? '')}`
                                                                            )
                                                                          ),
                                                                          p(Ft, Ot));
                                                                      };
                                                                      S(ma, (Ft) => {
                                                                        e(Lt) && e(ga) && Ft(Qt);
                                                                      });
                                                                    }
                                                                    p(Jt, Xt);
                                                                  };
                                                                  S(ja, (Jt) => {
                                                                    (e(At),
                                                                      s(
                                                                        () =>
                                                                          e(At).type === 'flight'
                                                                      ) && Jt(Yt));
                                                                  });
                                                                }
                                                                p(Ta, wa);
                                                              }
                                                            ),
                                                              p(sa, Pa));
                                                          };
                                                          S(cr, (sa) => {
                                                            e(pa) > 0 && sa(Ka);
                                                          });
                                                        }
                                                        p(ia, Va);
                                                      };
                                                    S(dr, (ia) => {
                                                      (e(Rt),
                                                        e(D),
                                                        s(
                                                          () =>
                                                            e(Rt) === Object.keys(st(e(D).data))[0]
                                                        )
                                                          ? ia(ua)
                                                          : ia(xa, !1));
                                                    });
                                                  }
                                                  (t(Ba), t(Kt));
                                                  var Ia = r(Kt, 2);
                                                  (bt(
                                                    Ia,
                                                    5,
                                                    () => (
                                                      e(D),
                                                      e(Rt),
                                                      s(() => st(e(D).data)[e(Rt)])
                                                    ),
                                                    (ia) => ia.id,
                                                    (ia, H) => {
                                                      var pa = he(),
                                                        Va = oe(pa);
                                                      {
                                                        var cr = (sa) => {
                                                            const oa = vt(
                                                                () => (
                                                                  e(D),
                                                                  e(H),
                                                                  s(() => Dt(e(D).data, e(H).id))
                                                                )
                                                              ),
                                                              Xa = vt(
                                                                () => (
                                                                  e(D),
                                                                  e(H),
                                                                  e(Rt),
                                                                  s(() =>
                                                                    qe(e(D).data, e(H).id, e(Rt))
                                                                  )
                                                                )
                                                              );
                                                            var Pa = Lo(),
                                                              la = oe(Pa);
                                                            let Ta;
                                                            var At = a(la),
                                                              wa = a(At),
                                                              ja = a(wa, !0);
                                                            (t(wa), Wt(2), t(At));
                                                            var Yt = r(At, 2),
                                                              Jt = a(Yt),
                                                              Lt = a(Jt, !0);
                                                            t(Jt);
                                                            var ga = r(Jt, 2),
                                                              Xt = a(ga);
                                                            (t(ga), t(Yt));
                                                            var ma = r(Yt, 2);
                                                            {
                                                              var Qt = (Tt) => {
                                                                var jt = Po(),
                                                                  zt = a(jt);
                                                                (ur(zt, {
                                                                  get companions() {
                                                                    return (
                                                                      e(H),
                                                                      s(() => e(H).itemCompanions)
                                                                    );
                                                                  },
                                                                }),
                                                                  t(jt),
                                                                  p(Tt, jt));
                                                              };
                                                              S(ma, (Tt) => {
                                                                (e(H),
                                                                  s(
                                                                    () =>
                                                                      e(H).itemCompanions &&
                                                                      e(H).itemCompanions.length > 0
                                                                  ) && Tt(Qt));
                                                              });
                                                            }
                                                            t(la);
                                                            var Ft = r(la, 2);
                                                            {
                                                              var Ot = (Tt) => {
                                                                var jt = Ro(),
                                                                  zt = a(jt),
                                                                  Na = a(zt);
                                                                (t(zt),
                                                                  t(jt),
                                                                  V(() =>
                                                                    O(
                                                                      Na,
                                                                      `${(Se(e(oa)), s(() => e(oa).duration) ?? '')} in ${(Se(e(oa)), s(() => e(oa).location) ?? '')}`
                                                                    )
                                                                  ),
                                                                  p(Tt, jt));
                                                              };
                                                              S(Ft, (Tt) => {
                                                                e(oa) && !e(Xa) && Tt(Ot);
                                                              });
                                                            }
                                                            (V(
                                                              (Tt, jt, zt) => {
                                                                ((Ta = Pt(
                                                                  la,
                                                                  1,
                                                                  'standalone-item-card svelte-x1i5gj',
                                                                  null,
                                                                  Ta,
                                                                  {
                                                                    'item-highlighted':
                                                                      e(_e) === e(H).id &&
                                                                      e(n) === 'flight',
                                                                  }
                                                                )),
                                                                  O(ja, Tt),
                                                                  O(
                                                                    Lt,
                                                                    (e(H),
                                                                    s(() => e(H).flightNumber))
                                                                  ),
                                                                  O(
                                                                    Xt,
                                                                    `${jt ?? ''} → ${zt ?? ''}`
                                                                  ));
                                                              },
                                                              [
                                                                () => (
                                                                  e(H),
                                                                  s(() =>
                                                                    Nt(
                                                                      e(H).departureDateTime,
                                                                      e(H).originTimezone
                                                                    )
                                                                  )
                                                                ),
                                                                () => (
                                                                  e(H),
                                                                  s(() => ee(e(H).origin))
                                                                ),
                                                                () => (
                                                                  e(H),
                                                                  s(() => ee(e(H).destination))
                                                                ),
                                                              ]
                                                            ),
                                                              z('mouseenter', la, () =>
                                                                ce('flight', e(H).id)
                                                              ),
                                                              z('mouseleave', la, B),
                                                              z('click', la, () =>
                                                                Z('flight', 'flight', e(H))
                                                              ),
                                                              z(
                                                                'keydown',
                                                                la,
                                                                (Tt) =>
                                                                  Tt.key === 'Enter' &&
                                                                  Z('flight', 'flight', e(H))
                                                              ),
                                                              p(sa, Pa));
                                                          },
                                                          Ka = (sa) => {
                                                            var oa = he(),
                                                              Xa = oe(oa);
                                                            {
                                                              var Pa = (Ta) => {
                                                                  var At = Oo();
                                                                  let wa;
                                                                  var ja = r(a(At), 2),
                                                                    Yt = a(ja),
                                                                    Jt = a(Yt, !0);
                                                                  t(Yt);
                                                                  var Lt = r(Yt, 2),
                                                                    ga = a(Lt);
                                                                  t(Lt);
                                                                  var Xt = r(Lt, 2),
                                                                    ma = a(Xt, !0);
                                                                  (t(Xt), t(ja));
                                                                  var Qt = r(ja, 2);
                                                                  {
                                                                    var Ft = (Ot) => {
                                                                      var Tt = Fo(),
                                                                        jt = a(Tt);
                                                                      (ur(jt, {
                                                                        get companions() {
                                                                          return (
                                                                            e(H),
                                                                            s(
                                                                              () =>
                                                                                e(H).itemCompanions
                                                                            )
                                                                          );
                                                                        },
                                                                      }),
                                                                        t(Tt),
                                                                        p(Ot, Tt));
                                                                    };
                                                                    S(Qt, (Ot) => {
                                                                      (e(H),
                                                                        s(
                                                                          () =>
                                                                            e(H).itemCompanions &&
                                                                            e(H).itemCompanions
                                                                              .length > 0
                                                                        ) && Ot(Ft));
                                                                    });
                                                                  }
                                                                  (t(At),
                                                                    V(
                                                                      (Ot, Tt, jt) => {
                                                                        ((wa = Pt(
                                                                          At,
                                                                          1,
                                                                          'standalone-item-card svelte-x1i5gj',
                                                                          null,
                                                                          wa,
                                                                          {
                                                                            'item-highlighted':
                                                                              e(_e) === e(H).id &&
                                                                              e(n) === 'hotel',
                                                                          }
                                                                        )),
                                                                          O(
                                                                            Jt,
                                                                            (e(H),
                                                                            s(
                                                                              () =>
                                                                                e(H).hotelName ||
                                                                                e(H).name
                                                                            ))
                                                                          ),
                                                                          O(
                                                                            ga,
                                                                            `${Ot ?? ''} - ${Tt ?? ''}`
                                                                          ),
                                                                          O(ma, jt));
                                                                      },
                                                                      [
                                                                        () => (
                                                                          e(H),
                                                                          s(() =>
                                                                            N(
                                                                              e(H).checkInDateTime,
                                                                              e(H).timezone
                                                                            )
                                                                          )
                                                                        ),
                                                                        () => (
                                                                          e(H),
                                                                          s(() =>
                                                                            N(
                                                                              e(H).checkOutDateTime,
                                                                              e(H).timezone
                                                                            )
                                                                          )
                                                                        ),
                                                                        () => (
                                                                          e(H),
                                                                          s(() =>
                                                                            ee(e(H).address)
                                                                              ? ee(e(H).address)
                                                                              : ee(e(H).city)
                                                                          )
                                                                        ),
                                                                      ]
                                                                    ),
                                                                    z('mouseenter', At, () =>
                                                                      ce('hotel', e(H).id)
                                                                    ),
                                                                    z('mouseleave', At, B),
                                                                    z('click', At, () =>
                                                                      Z('hotel', 'hotel', e(H))
                                                                    ),
                                                                    z(
                                                                      'keydown',
                                                                      At,
                                                                      (Ot) =>
                                                                        Ot.key === 'Enter' &&
                                                                        Z('hotel', 'hotel', e(H))
                                                                    ),
                                                                    p(Ta, At));
                                                                },
                                                                la = (Ta) => {
                                                                  var At = he(),
                                                                    wa = oe(At);
                                                                  {
                                                                    var ja = (Jt) => {
                                                                        var Lt = zo(),
                                                                          ga = a(Lt),
                                                                          Xt = a(ga),
                                                                          ma = a(Xt, !0);
                                                                        t(Xt);
                                                                        var Qt = r(Xt, 2),
                                                                          Ft = a(Qt),
                                                                          Ot = a(Ft, !0);
                                                                        (t(Ft), t(Qt), t(ga));
                                                                        var Tt = r(ga, 2),
                                                                          jt = a(Tt),
                                                                          zt = a(jt, !0);
                                                                        t(jt);
                                                                        var Na = r(jt, 2),
                                                                          tr = a(Na);
                                                                        (t(Na),
                                                                          t(Tt),
                                                                          t(Lt),
                                                                          V(
                                                                            (
                                                                              Qa,
                                                                              Ra,
                                                                              er,
                                                                              Er,
                                                                              vr
                                                                            ) => {
                                                                              (O(ma, Qa),
                                                                                O(Ot, Ra),
                                                                                O(zt, er),
                                                                                O(
                                                                                  tr,
                                                                                  `${Er ?? ''} → ${vr ?? ''}`
                                                                                ));
                                                                            },
                                                                            [
                                                                              () => (
                                                                                e(H),
                                                                                s(() =>
                                                                                  Nt(
                                                                                    e(H)
                                                                                      .departureDateTime,
                                                                                    e(H)
                                                                                      .originTimezone
                                                                                  )
                                                                                )
                                                                              ),
                                                                              () => (
                                                                                e(H),
                                                                                s(() =>
                                                                                  ae(e(H).method)
                                                                                )
                                                                              ),
                                                                              () => (
                                                                                e(H),
                                                                                s(() =>
                                                                                  Je(e(H).method)
                                                                                )
                                                                              ),
                                                                              () => (
                                                                                e(H),
                                                                                s(() =>
                                                                                  ee(e(H).origin)
                                                                                )
                                                                              ),
                                                                              () => (
                                                                                e(H),
                                                                                s(() =>
                                                                                  ee(
                                                                                    e(H).destination
                                                                                  )
                                                                                )
                                                                              ),
                                                                            ]
                                                                          ),
                                                                          z('click', Lt, () =>
                                                                            Z(
                                                                              'transportation',
                                                                              'transportation',
                                                                              e(H)
                                                                            )
                                                                          ),
                                                                          z(
                                                                            'keydown',
                                                                            Lt,
                                                                            (Qa) =>
                                                                              Qa.key === 'Enter' &&
                                                                              Z(
                                                                                'transportation',
                                                                                'transportation',
                                                                                e(H)
                                                                              )
                                                                          ),
                                                                          p(Jt, Lt));
                                                                      },
                                                                      Yt = (Jt) => {
                                                                        var Lt = he(),
                                                                          ga = oe(Lt);
                                                                        {
                                                                          var Xt = (Qt) => {
                                                                              var Ft = Uo(),
                                                                                Ot = r(a(Ft), 2),
                                                                                Tt = a(Ot),
                                                                                jt = a(Tt, !0);
                                                                              t(Tt);
                                                                              var zt = r(Tt, 2),
                                                                                Na = a(zt, !0);
                                                                              t(zt);
                                                                              var tr = r(zt, 2),
                                                                                Qa = a(tr, !0);
                                                                              (t(tr),
                                                                                t(Ot),
                                                                                t(Ft),
                                                                                V(
                                                                                  (Ra, er) => {
                                                                                    (O(
                                                                                      jt,
                                                                                      (e(H),
                                                                                      s(
                                                                                        () =>
                                                                                          e(H)
                                                                                            .company
                                                                                      ))
                                                                                    ),
                                                                                      O(Na, Ra),
                                                                                      O(Qa, er));
                                                                                  },
                                                                                  [
                                                                                    () => (
                                                                                      e(H),
                                                                                      s(() =>
                                                                                        Mt(
                                                                                          e(H)
                                                                                            .pickupDateTime,
                                                                                          e(H)
                                                                                            .pickupTimezone
                                                                                        )
                                                                                      )
                                                                                    ),
                                                                                    () => (
                                                                                      e(H),
                                                                                      s(() =>
                                                                                        ee(
                                                                                          e(H)
                                                                                            .pickupLocation
                                                                                        )
                                                                                      )
                                                                                    ),
                                                                                  ]
                                                                                ),
                                                                                z('click', Ft, () =>
                                                                                  Z(
                                                                                    'carRental',
                                                                                    'carRental',
                                                                                    e(H)
                                                                                  )
                                                                                ),
                                                                                z(
                                                                                  'keydown',
                                                                                  Ft,
                                                                                  (Ra) =>
                                                                                    Ra.key ===
                                                                                      'Enter' &&
                                                                                    Z(
                                                                                      'carRental',
                                                                                      'carRental',
                                                                                      e(H)
                                                                                    )
                                                                                ),
                                                                                p(Qt, Ft));
                                                                            },
                                                                            ma = (Qt) => {
                                                                              var Ft = he(),
                                                                                Ot = oe(Ft);
                                                                              {
                                                                                var Tt = (jt) => {
                                                                                  var zt = Jo(),
                                                                                    Na = a(zt);
                                                                                  {
                                                                                    var tr = (
                                                                                        _a
                                                                                      ) => {
                                                                                        var La =
                                                                                          Ho();
                                                                                        p(_a, La);
                                                                                      },
                                                                                      Qa = (_a) => {
                                                                                        var La =
                                                                                            Bo(),
                                                                                          Tr =
                                                                                            a(La),
                                                                                          un = a(
                                                                                            Tr,
                                                                                            !0
                                                                                          );
                                                                                        (t(Tr),
                                                                                          Wt(2),
                                                                                          t(La),
                                                                                          V(
                                                                                            (pn) =>
                                                                                              O(
                                                                                                un,
                                                                                                pn
                                                                                              ),
                                                                                            [
                                                                                              () => (
                                                                                                e(
                                                                                                  H
                                                                                                ),
                                                                                                s(
                                                                                                  () =>
                                                                                                    Nt(
                                                                                                      e(
                                                                                                        H
                                                                                                      )
                                                                                                        .startDateTime,
                                                                                                      e(
                                                                                                        H
                                                                                                      )
                                                                                                        .timezone
                                                                                                    )
                                                                                                )
                                                                                              ),
                                                                                            ]
                                                                                          ),
                                                                                          p(
                                                                                            _a,
                                                                                            La
                                                                                          ));
                                                                                      };
                                                                                    S(Na, (_a) => {
                                                                                      (e(H),
                                                                                        s(
                                                                                          () =>
                                                                                            e(H)
                                                                                              .isAllDay
                                                                                        )
                                                                                          ? _a(tr)
                                                                                          : _a(
                                                                                              Qa,
                                                                                              !1
                                                                                            ));
                                                                                    });
                                                                                  }
                                                                                  var Ra = r(Na, 2),
                                                                                    er = a(Ra),
                                                                                    Er = a(er, !0);
                                                                                  t(er);
                                                                                  var vr = r(er, 2),
                                                                                    ln = a(vr, !0);
                                                                                  t(vr);
                                                                                  var zr = r(vr, 2),
                                                                                    dn = a(zr, !0);
                                                                                  (t(zr), t(Ra));
                                                                                  var cn = r(Ra, 2);
                                                                                  {
                                                                                    var vn = (
                                                                                      _a
                                                                                    ) => {
                                                                                      var La = Vo(),
                                                                                        Tr = a(La);
                                                                                      (ur(Tr, {
                                                                                        get companions() {
                                                                                          return (
                                                                                            e(H),
                                                                                            s(
                                                                                              () =>
                                                                                                e(H)
                                                                                                  .itemCompanions
                                                                                            )
                                                                                          );
                                                                                        },
                                                                                      }),
                                                                                        t(La),
                                                                                        p(_a, La));
                                                                                    };
                                                                                    S(cn, (_a) => {
                                                                                      (e(H),
                                                                                        s(
                                                                                          () =>
                                                                                            e(H)
                                                                                              .itemCompanions &&
                                                                                            e(H)
                                                                                              .itemCompanions
                                                                                              .length >
                                                                                              0
                                                                                        ) &&
                                                                                          _a(vn));
                                                                                    });
                                                                                  }
                                                                                  (t(zt),
                                                                                    V(
                                                                                      (_a) => {
                                                                                        (O(
                                                                                          Er,
                                                                                          (e(H),
                                                                                          s(
                                                                                            () =>
                                                                                              e(H)
                                                                                                .name
                                                                                          ))
                                                                                        ),
                                                                                          O(ln, _a),
                                                                                          O(
                                                                                            dn,
                                                                                            (e(H),
                                                                                            s(
                                                                                              () =>
                                                                                                e(H)
                                                                                                  .location
                                                                                            ))
                                                                                          ));
                                                                                      },
                                                                                      [
                                                                                        () => (
                                                                                          e(H),
                                                                                          s(() =>
                                                                                            Mt(
                                                                                              e(H)
                                                                                                .startDateTime,
                                                                                              e(H)
                                                                                                .timezone
                                                                                            )
                                                                                          )
                                                                                        ),
                                                                                      ]
                                                                                    ),
                                                                                    z(
                                                                                      'click',
                                                                                      zt,
                                                                                      () =>
                                                                                        Z(
                                                                                          'event',
                                                                                          'event',
                                                                                          e(H)
                                                                                        )
                                                                                    ),
                                                                                    z(
                                                                                      'keydown',
                                                                                      zt,
                                                                                      (_a) =>
                                                                                        _a.key ===
                                                                                          'Enter' &&
                                                                                        Z(
                                                                                          'event',
                                                                                          'event',
                                                                                          e(H)
                                                                                        )
                                                                                    ),
                                                                                    p(jt, zt));
                                                                                };
                                                                                S(
                                                                                  Ot,
                                                                                  (jt) => {
                                                                                    (e(H),
                                                                                      s(
                                                                                        () =>
                                                                                          e(H)
                                                                                            .type ===
                                                                                          'event'
                                                                                      ) && jt(Tt));
                                                                                  },
                                                                                  !0
                                                                                );
                                                                              }
                                                                              p(Qt, Ft);
                                                                            };
                                                                          S(
                                                                            ga,
                                                                            (Qt) => {
                                                                              (e(H),
                                                                                s(
                                                                                  () =>
                                                                                    e(H).type ===
                                                                                    'carRental'
                                                                                )
                                                                                  ? Qt(Xt)
                                                                                  : Qt(ma, !1));
                                                                            },
                                                                            !0
                                                                          );
                                                                        }
                                                                        p(Jt, Lt);
                                                                      };
                                                                    S(
                                                                      wa,
                                                                      (Jt) => {
                                                                        (e(H),
                                                                          s(
                                                                            () =>
                                                                              e(H).type ===
                                                                              'transportation'
                                                                          )
                                                                            ? Jt(ja)
                                                                            : Jt(Yt, !1));
                                                                      },
                                                                      !0
                                                                    );
                                                                  }
                                                                  p(Ta, At);
                                                                };
                                                              S(
                                                                Xa,
                                                                (Ta) => {
                                                                  (e(H),
                                                                    s(() => e(H).type === 'hotel')
                                                                      ? Ta(Pa)
                                                                      : Ta(la, !1));
                                                                },
                                                                !0
                                                              );
                                                            }
                                                            p(sa, oa);
                                                          };
                                                        S(Va, (sa) => {
                                                          (e(H),
                                                            s(() => e(H).type === 'flight')
                                                              ? sa(cr)
                                                              : sa(Ka, !1));
                                                        });
                                                      }
                                                      p(ia, pa);
                                                    }
                                                  ),
                                                    t(Ia),
                                                    t(Ea),
                                                    V(
                                                      (ia) => O(qa, ia),
                                                      [() => (e(Rt), s(() => Et(e(Rt))))]
                                                    ),
                                                    p(Zt, Ea));
                                                }
                                              ),
                                                t($t),
                                                p(gt, $t));
                                            };
                                            S(Aa, (gt) => {
                                              (e(te),
                                                e(D),
                                                s(() => e(te).has(e(D).data.id)) && gt(Za));
                                            });
                                          }
                                          (t(ct),
                                            V(
                                              (gt, $t, Zt, Rt, Ea) => {
                                                ((Ct = Pt(
                                                  ct,
                                                  1,
                                                  'trip-card svelte-x1i5gj',
                                                  null,
                                                  Ct,
                                                  gt
                                                )),
                                                  O(ba, $t),
                                                  O(Gt, (e(D), s(() => e(D).data.name))),
                                                  O(or, `${Zt ?? ''} - ${Rt ?? ''}`),
                                                  (kt = Pt(
                                                    na,
                                                    1,
                                                    'expand-btn svelte-x1i5gj',
                                                    null,
                                                    kt,
                                                    Ea
                                                  )));
                                              },
                                              [
                                                () => ({
                                                  expanded: e(te).has(e(D).data.id),
                                                  highlighted: e(we) === e(D).data.id,
                                                }),
                                                () => (e(D), s(() => ke(e(D).data.purpose))),
                                                () => (e(D), s(() => $e(e(D).data.departureDate))),
                                                () => (
                                                  e(D),
                                                  s(() =>
                                                    $e(
                                                      e(D).data.returnDate ||
                                                        e(D).data.departureDate
                                                    )
                                                  )
                                                ),
                                                () => ({ rotated: e(te).has(e(D).data.id) }),
                                              ]
                                            ),
                                            z('click', Ya, (gt) => {
                                              (gt.stopPropagation(),
                                                l(A, {
                                                  type: 'item',
                                                  itemType: 'trip',
                                                  data: e(D).data,
                                                }));
                                            }),
                                            z('click', na, (gt) => {
                                              (gt.stopPropagation(), W(e(D).data.id));
                                            }),
                                            z('click', Bt, () => W(e(D).data.id)),
                                            z(
                                              'keydown',
                                              Bt,
                                              (gt) => gt.key === 'Enter' && W(e(D).data.id)
                                            ),
                                            z('mouseenter', ct, () => re(e(D).data.id)),
                                            z('mouseleave', ct, () => ie()),
                                            p(Re, ct));
                                        },
                                        ht = (Re) => {
                                          var ct = Qo(),
                                            Ct = a(ct),
                                            Bt = a(Ct),
                                            Ht = a(Bt, !0);
                                          (t(Bt), t(Ct));
                                          var Vt = r(Ct, 2),
                                            ba = a(Vt),
                                            $a = a(ba, !0);
                                          t(ba);
                                          var Da = r(ba, 2);
                                          {
                                            var ra = (kt) => {
                                                var It = Zo(),
                                                  ka = a(It);
                                                (t(It),
                                                  V(
                                                    (Aa, Za) => O(ka, `${Aa ?? ''} - ${Za ?? ''}`),
                                                    [
                                                      () => (
                                                        e(D),
                                                        s(() =>
                                                          N(
                                                            e(D).data.checkInDateTime,
                                                            e(D).data.timezone
                                                          )
                                                        )
                                                      ),
                                                      () => (
                                                        e(D),
                                                        s(() =>
                                                          N(
                                                            e(D).data.checkOutDateTime,
                                                            e(D).data.timezone
                                                          )
                                                        )
                                                      ),
                                                    ]
                                                  ),
                                                  p(kt, It));
                                              },
                                              Gt = (kt) => {
                                                var It = Ko(),
                                                  ka = a(It);
                                                {
                                                  var Aa = (gt) => {
                                                      var $t = Ca();
                                                      (V(
                                                        (Zt) => O($t, Zt),
                                                        [
                                                          () => (
                                                            e(D),
                                                            s(() =>
                                                              Mt(
                                                                e(D).data.departureDateTime,
                                                                e(D).data.originTimezone
                                                              )
                                                            )
                                                          ),
                                                        ]
                                                      ),
                                                        p(gt, $t));
                                                    },
                                                    Za = (gt) => {
                                                      var $t = he(),
                                                        Zt = oe($t);
                                                      {
                                                        var Rt = (Kt) => {
                                                            var va = Ca();
                                                            (V(
                                                              (qa) => O(va, qa),
                                                              [
                                                                () => (
                                                                  e(D),
                                                                  s(() =>
                                                                    Mt(
                                                                      e(D).data.departureDateTime,
                                                                      e(D).data.originTimezone
                                                                    )
                                                                  )
                                                                ),
                                                              ]
                                                            ),
                                                              p(Kt, va));
                                                          },
                                                          Ea = (Kt) => {
                                                            var va = he(),
                                                              qa = oe(va);
                                                            {
                                                              var Ba = (ua) => {
                                                                  var xa = Ca();
                                                                  (V(
                                                                    (Ia) => O(xa, Ia),
                                                                    [
                                                                      () => (
                                                                        e(D),
                                                                        s(() =>
                                                                          Mt(
                                                                            e(D).data
                                                                              .pickupDateTime,
                                                                            e(D).data.pickupTimezone
                                                                          )
                                                                        )
                                                                      ),
                                                                    ]
                                                                  ),
                                                                    p(ua, xa));
                                                                },
                                                                dr = (ua) => {
                                                                  var xa = he(),
                                                                    Ia = oe(xa);
                                                                  {
                                                                    var ia = (H) => {
                                                                      var pa = Ca();
                                                                      (V(
                                                                        (Va) => O(pa, Va),
                                                                        [
                                                                          () => (
                                                                            e(D),
                                                                            s(() =>
                                                                              Mt(
                                                                                e(D).data
                                                                                  .startDateTime,
                                                                                e(D).data.timezone
                                                                              )
                                                                            )
                                                                          ),
                                                                        ]
                                                                      ),
                                                                        p(H, pa));
                                                                    };
                                                                    S(
                                                                      Ia,
                                                                      (H) => {
                                                                        (e(D),
                                                                          s(
                                                                            () =>
                                                                              e(D).itemType ===
                                                                              'event'
                                                                          ) && H(ia));
                                                                      },
                                                                      !0
                                                                    );
                                                                  }
                                                                  p(ua, xa);
                                                                };
                                                              S(
                                                                qa,
                                                                (ua) => {
                                                                  (e(D),
                                                                    s(
                                                                      () =>
                                                                        e(D).itemType ===
                                                                        'carRental'
                                                                    )
                                                                      ? ua(Ba)
                                                                      : ua(dr, !1));
                                                                },
                                                                !0
                                                              );
                                                            }
                                                            p(Kt, va);
                                                          };
                                                        S(
                                                          Zt,
                                                          (Kt) => {
                                                            (e(D),
                                                              s(
                                                                () =>
                                                                  e(D).itemType === 'transportation'
                                                              )
                                                                ? Kt(Rt)
                                                                : Kt(Ea, !1));
                                                          },
                                                          !0
                                                        );
                                                      }
                                                      p(gt, $t);
                                                    };
                                                  S(ka, (gt) => {
                                                    (e(D),
                                                      s(() => e(D).itemType === 'flight')
                                                        ? gt(Aa)
                                                        : gt(Za, !1));
                                                  });
                                                }
                                                (t(It), p(kt, It));
                                              };
                                            S(Da, (kt) => {
                                              (e(D),
                                                s(() => e(D).itemType === 'hotel')
                                                  ? kt(ra)
                                                  : kt(Gt, !1));
                                            });
                                          }
                                          var Ya = r(Da, 2),
                                            Wa = a(Ya);
                                          {
                                            var or = (kt) => {
                                                var It = Ca();
                                                (V(
                                                  (ka, Aa) => O(It, `${ka ?? ''} → ${Aa ?? ''}`),
                                                  [
                                                    () => (e(D), s(() => ee(e(D).data.origin))),
                                                    () => (
                                                      e(D),
                                                      s(() => ee(e(D).data.destination))
                                                    ),
                                                  ]
                                                ),
                                                  p(kt, It));
                                              },
                                              lr = (kt) => {
                                                var It = he(),
                                                  ka = oe(It);
                                                {
                                                  var Aa = (gt) => {
                                                      var $t = Ca();
                                                      (V(
                                                        (Zt) => O($t, Zt),
                                                        [
                                                          () => (
                                                            e(D),
                                                            s(() => ee(e(D).data.address))
                                                          ),
                                                        ]
                                                      ),
                                                        p(gt, $t));
                                                    },
                                                    Za = (gt) => {
                                                      var $t = he(),
                                                        Zt = oe($t);
                                                      {
                                                        var Rt = (Kt) => {
                                                            var va = Ca();
                                                            (V(
                                                              (qa, Ba) =>
                                                                O(va, `${qa ?? ''} → ${Ba ?? ''}`),
                                                              [
                                                                () => (
                                                                  e(D),
                                                                  s(() => ee(e(D).data.origin))
                                                                ),
                                                                () => (
                                                                  e(D),
                                                                  s(() => ee(e(D).data.destination))
                                                                ),
                                                              ]
                                                            ),
                                                              p(Kt, va));
                                                          },
                                                          Ea = (Kt) => {
                                                            var va = he(),
                                                              qa = oe(va);
                                                            {
                                                              var Ba = (ua) => {
                                                                  var xa = Ca();
                                                                  (V(
                                                                    (Ia) => O(xa, Ia),
                                                                    [
                                                                      () => (
                                                                        e(D),
                                                                        s(() =>
                                                                          ee(
                                                                            e(D).data.pickupLocation
                                                                          )
                                                                        )
                                                                      ),
                                                                    ]
                                                                  ),
                                                                    p(ua, xa));
                                                                },
                                                                dr = (ua) => {
                                                                  var xa = he(),
                                                                    Ia = oe(xa);
                                                                  {
                                                                    var ia = (H) => {
                                                                      var pa = Ca();
                                                                      (V(() =>
                                                                        O(
                                                                          pa,
                                                                          (e(D),
                                                                          s(
                                                                            () => e(D).data.location
                                                                          ))
                                                                        )
                                                                      ),
                                                                        p(H, pa));
                                                                    };
                                                                    S(
                                                                      Ia,
                                                                      (H) => {
                                                                        (e(D),
                                                                          s(
                                                                            () =>
                                                                              e(D).itemType ===
                                                                              'event'
                                                                          ) && H(ia));
                                                                      },
                                                                      !0
                                                                    );
                                                                  }
                                                                  p(ua, xa);
                                                                };
                                                              S(
                                                                qa,
                                                                (ua) => {
                                                                  (e(D),
                                                                    s(
                                                                      () =>
                                                                        e(D).itemType ===
                                                                        'carRental'
                                                                    )
                                                                      ? ua(Ba)
                                                                      : ua(dr, !1));
                                                                },
                                                                !0
                                                              );
                                                            }
                                                            p(Kt, va);
                                                          };
                                                        S(
                                                          Zt,
                                                          (Kt) => {
                                                            (e(D),
                                                              s(
                                                                () =>
                                                                  e(D).itemType === 'transportation'
                                                              )
                                                                ? Kt(Rt)
                                                                : Kt(Ea, !1));
                                                          },
                                                          !0
                                                        );
                                                      }
                                                      p(gt, $t);
                                                    };
                                                  S(
                                                    ka,
                                                    (gt) => {
                                                      (e(D),
                                                        s(() => e(D).itemType === 'hotel')
                                                          ? gt(Aa)
                                                          : gt(Za, !1));
                                                    },
                                                    !0
                                                  );
                                                }
                                                p(kt, It);
                                              };
                                            S(Wa, (kt) => {
                                              (e(D),
                                                s(() => e(D).itemType === 'flight')
                                                  ? kt(or)
                                                  : kt(lr, !1));
                                            });
                                          }
                                          (t(Ya), t(Vt));
                                          var Sa = r(Vt, 2);
                                          {
                                            var na = (kt) => {
                                              var It = Xo(),
                                                ka = a(It);
                                              (ur(ka, {
                                                get companions() {
                                                  return (e(D), s(() => e(D).data.itemCompanions));
                                                },
                                              }),
                                                t(It),
                                                p(kt, It));
                                            };
                                            S(Sa, (kt) => {
                                              (e(D),
                                                s(
                                                  () =>
                                                    e(D).data.itemCompanions &&
                                                    e(D).data.itemCompanions.length > 0
                                                ) && kt(na));
                                            });
                                          }
                                          (t(ct),
                                            V(
                                              (kt) => {
                                                (Pt(
                                                  Ct,
                                                  1,
                                                  `item-icon ${(e(D), s(() => (e(D).itemType === 'flight' ? 'blue' : e(D).itemType === 'hotel' ? 'green' : e(D).itemType === 'carRental' ? 'gray' : e(D).itemType === 'event' ? 'purple' : 'red')) ?? '')}`,
                                                  'svelte-x1i5gj'
                                                ),
                                                  O(Ht, kt),
                                                  O(
                                                    $a,
                                                    (e(D),
                                                    s(() =>
                                                      e(D).itemType === 'flight'
                                                        ? e(D).data.flightNumber
                                                        : e(D).itemType === 'hotel'
                                                          ? e(D).data.hotelName || e(D).data.name
                                                          : e(D).itemType === 'carRental'
                                                            ? e(D).data.company
                                                            : e(D).itemType === 'event'
                                                              ? e(D).data.name
                                                              : e(D).data.method
                                                    ))
                                                  ));
                                              },
                                              [
                                                () => (
                                                  e(D),
                                                  s(() =>
                                                    e(D).itemType === 'flight'
                                                      ? 'flight'
                                                      : e(D).itemType === 'hotel'
                                                        ? 'hotel'
                                                        : e(D).itemType === 'carRental'
                                                          ? 'directions_car'
                                                          : e(D).itemType === 'event'
                                                            ? 'event'
                                                            : ae(e(D).data.method)
                                                  )
                                                ),
                                              ]
                                            ),
                                            z('click', ct, () =>
                                              Z(e(D).itemType, e(D).itemType, e(D).data)
                                            ),
                                            z('mouseenter', ct, () =>
                                              ce(e(D).itemType, e(D).data.id)
                                            ),
                                            z('mouseleave', ct, B),
                                            z(
                                              'keydown',
                                              ct,
                                              (kt) =>
                                                kt.key === 'Enter' &&
                                                Z(e(D).itemType, e(D).itemType, e(D).data)
                                            ),
                                            p(Re, ct));
                                        };
                                      S(Ke, (Re) => {
                                        (e(D), s(() => e(D).type === 'trip') ? Re(it) : Re(ht, !1));
                                      });
                                    }
                                    p(at, wt);
                                  }
                                ),
                                  t(Ut),
                                  t(St),
                                  V((at) => O(qt, at), [() => (e(_t), s(() => Ve(e(_t))))]),
                                  p(nt, St));
                              }
                            ),
                              t(Ne),
                              p(Oe, Ne));
                          };
                        S(
                          Ce,
                          (Oe) => {
                            (e(v), s(() => e(v).length === 0) ? Oe(mt) : Oe(ft, !1));
                          },
                          !0
                        );
                      }
                      p(De, Be);
                    };
                  S(
                    Te,
                    (De) => {
                      e(L) ? De(rt) : De(Pe, !1);
                    },
                    !0
                  );
                }
                p(Fe, lt);
              };
            S(xt, (Fe) => {
              e(R) === 'settings' ? Fe(x) : Fe(pt, !1);
            });
          }
          (t(We),
            t(_),
            V(() => {
              ((et = Pt(Qe, 1, 'tab-btn svelte-x1i5gj', null, et, {
                active: e(R) === 'trips' && e(h) === 'upcoming',
              })),
                (He = Pt(ut, 1, 'tab-btn svelte-x1i5gj', null, He, {
                  active: e(R) === 'trips' && e(h) === 'past',
                })),
                (Le = Pt(be, 1, 'tab-btn settings-btn svelte-x1i5gj', null, Le, {
                  active: e(R) === 'settings',
                })));
            }),
            z('click', Me, P),
            z('click', je, M),
            z('click', Qe, () => {
              (l(R, 'trips'), E('upcoming'));
            }),
            z('click', ut, () => {
              (l(R, 'trips'), E('past'));
            }),
            z('click', be, () => l(R, 'settings')),
            p($, _));
        },
        secondary: ($, T) => {
          var _ = cl();
          let q;
          var de = a(_);
          {
            var Ie = (je) => {
                var Ue = rl(),
                  ot = a(Ue),
                  yt = r(a(ot), 2);
                t(ot);
                var tt = r(ot, 2);
                (_s(tt, {
                  get trips() {
                    return e(g);
                  },
                  get standaloneItems() {
                    return e(u);
                  },
                  onItemClick: Z,
                }),
                  t(Ue),
                  z('click', yt, G),
                  p(je, Ue));
              },
              Me = (je) => {
                var Ue = he(),
                  ot = oe(Ue);
                {
                  var yt = (Qe) => {
                      var et = nl(),
                        ut = a(et),
                        He = r(a(ut), 2);
                      t(ut);
                      var be = r(ut, 2),
                        Le = a(be);
                      {
                        let We = vt(() => (e(A), s(() => e(A)?.data)));
                        xs(Le, {
                          get data() {
                            return e(We);
                          },
                        });
                      }
                      (t(be), t(et), z('click', He, G), p(Qe, et));
                    },
                    tt = (Qe) => {
                      var et = he(),
                        ut = oe(et);
                      {
                        var He = (Le) => {
                            var We = il(),
                              xt = a(We),
                              x = r(a(xt), 2);
                            t(xt);
                            var pt = r(xt, 2),
                              Fe = a(pt);
                            (Cs(Fe, {}), t(pt), t(We), z('click', x, G), p(Le, We));
                          },
                          be = (Le) => {
                            var We = he(),
                              xt = oe(We);
                            {
                              var x = (Fe) => {
                                  var lt = sl(),
                                    Te = a(lt),
                                    rt = r(a(Te), 2);
                                  t(Te);
                                  var Pe = r(Te, 2);
                                  (Zs(Pe, {
                                    onEditVoucher: (De) => U('edit-voucher', { voucher: De }),
                                    onAddVoucher: () => U('add-voucher', {}),
                                  }),
                                    t(lt),
                                    z('click', rt, G),
                                    p(Fe, lt));
                                },
                                pt = (Fe) => {
                                  var lt = he(),
                                    Te = oe(lt);
                                  {
                                    var rt = (De) => {
                                        var Be = ol(),
                                          Ce = a(Be),
                                          mt = r(a(Ce), 2),
                                          ft = a(mt),
                                          Oe = r(ft, 2);
                                        (t(mt), t(Ce));
                                        var Ne = r(Ce, 2);
                                        (so(Ne, {}),
                                          t(Be),
                                          z('click', ft, () => U('add-companion', {})),
                                          z('click', Oe, G),
                                          p(De, Be));
                                      },
                                      Pe = (De) => {
                                        var Be = he(),
                                          Ce = oe(Be);
                                        {
                                          var mt = (Oe) => {
                                              var Ne = ll(),
                                                nt = a(Ne),
                                                _t = r(a(nt), 2);
                                              t(nt);
                                              var St = r(nt, 2);
                                              (wo(St, {}), t(Ne), z('click', _t, G), p(Oe, Ne));
                                            },
                                            ft = (Oe) => {
                                              var Ne = he(),
                                                nt = oe(Ne);
                                              {
                                                var _t = (Ee) => {
                                                    var dt = dl(),
                                                      qt = a(dt),
                                                      Ut = r(a(qt), 2);
                                                    t(qt);
                                                    var at = r(qt, 2),
                                                      D = a(at),
                                                      wt = r(D, 4),
                                                      Ke = r(wt, 2),
                                                      it = r(Ke, 2),
                                                      ht = r(it, 2),
                                                      Re = r(ht, 2);
                                                    (t(at),
                                                      t(dt),
                                                      z('click', Ut, G),
                                                      z('click', D, b),
                                                      z('click', wt, () => k('flight')),
                                                      z('click', Ke, () => k('hotel')),
                                                      z('click', it, () => k('transportation')),
                                                      z('click', ht, () => k('carRental')),
                                                      z('click', Re, () => k('event')),
                                                      p(Ee, dt));
                                                  },
                                                  St = (Ee) => {
                                                    var dt = he(),
                                                      qt = oe(dt);
                                                    {
                                                      var Ut = (at) => {
                                                        {
                                                          let D = vt(
                                                              () => (
                                                                e(A),
                                                                s(() => e(A).itemType || e(A).type)
                                                              )
                                                            ),
                                                            wt = vt(
                                                              () => (
                                                                e(A),
                                                                s(() => e(A).data?.tripId || '')
                                                              )
                                                            );
                                                          ds(at, {
                                                            get itemType() {
                                                              return e(D);
                                                            },
                                                            get data() {
                                                              return (e(A), s(() => e(A).data));
                                                            },
                                                            get tripId() {
                                                              return e(wt);
                                                            },
                                                            get allTrips() {
                                                              return e(g);
                                                            },
                                                            onClose: G,
                                                            onSave: async (Ke) => {
                                                              if (e(A)) {
                                                                if (Ke === null)
                                                                  if (e(A).type === 'trip')
                                                                    l(
                                                                      g,
                                                                      e(g).filter(
                                                                        (it) =>
                                                                          it.id !== e(A).data.id
                                                                      )
                                                                    );
                                                                  else {
                                                                    const it = e(A).itemType + 's';
                                                                    e(u)[it] &&
                                                                      Y(
                                                                        u,
                                                                        (e(u)[it] = e(u)[it].filter(
                                                                          (ht) =>
                                                                            ht.id !== e(A).data.id
                                                                        ))
                                                                      );
                                                                  }
                                                                else if (e(A).type === 'trip') {
                                                                  const it = e(g).findIndex(
                                                                    (ht) => ht.id === Ke.id
                                                                  );
                                                                  it >= 0
                                                                    ? (Y(g, (e(g)[it] = Ke)),
                                                                      l(g, e(g)))
                                                                    : l(g, [...e(g), Ke]);
                                                                } else {
                                                                  const it = e(A).data?.tripId,
                                                                    ht = Ke.tripId,
                                                                    Re = e(A).itemType + 's';
                                                                  if (it !== ht) {
                                                                    const ct = new Set();
                                                                    (it && ct.add(it),
                                                                      ht && ct.add(ht));
                                                                    for (const Ct of ct)
                                                                      try {
                                                                        const Bt =
                                                                            await ir.getOne(Ct),
                                                                          Ht = e(g).findIndex(
                                                                            (Vt) => Vt.id === Ct
                                                                          );
                                                                        Ht >= 0 &&
                                                                          Y(g, (e(g)[Ht] = Bt));
                                                                      } catch (Bt) {
                                                                        console.error(
                                                                          'Error refetching trip:',
                                                                          Bt
                                                                        );
                                                                      }
                                                                    (l(g, e(g)),
                                                                      !it &&
                                                                        ht &&
                                                                        e(u)[Re] &&
                                                                        Y(
                                                                          u,
                                                                          (e(u)[Re] = e(u)[
                                                                            Re
                                                                          ].filter(
                                                                            (Ct) => Ct.id !== Ke.id
                                                                          ))
                                                                        ),
                                                                      it &&
                                                                        !ht &&
                                                                        (e(u)[Re]
                                                                          ? Y(
                                                                              u,
                                                                              (e(u)[Re] = [
                                                                                ...e(u)[Re],
                                                                                Ke,
                                                                              ])
                                                                            )
                                                                          : Y(
                                                                              u,
                                                                              (e(u)[Re] = [Ke])
                                                                            )));
                                                                  } else if (ht) {
                                                                    const ct = e(g).findIndex(
                                                                      (Ct) => Ct.id === ht
                                                                    );
                                                                    if (ct >= 0) {
                                                                      const Ct = e(g)[ct];
                                                                      if (Ct[Re]) {
                                                                        const Bt = Ct[Re].findIndex(
                                                                          (Ht) => Ht.id === Ke.id
                                                                        );
                                                                        Bt >= 0 &&
                                                                          (Ct[Re][Bt] = Ke);
                                                                      }
                                                                      (Y(g, (e(g)[ct] = Ct)),
                                                                        l(g, e(g)));
                                                                    }
                                                                  } else if (e(u)[Re]) {
                                                                    const ct = e(u)[Re].findIndex(
                                                                      (Ct) => Ct.id === Ke.id
                                                                    );
                                                                    ct >= 0
                                                                      ? (Y(u, (e(u)[Re][ct] = Ke)),
                                                                        Y(u, (e(u)[Re] = e(u)[Re])))
                                                                      : Y(
                                                                          u,
                                                                          (e(u)[Re] = [
                                                                            ...e(u)[Re],
                                                                            Ke,
                                                                          ])
                                                                        );
                                                                  } else Y(u, (e(u)[Re] = [Ke]));
                                                                }
                                                                (y(), Q());
                                                              }
                                                            },
                                                          });
                                                        }
                                                      };
                                                      S(
                                                        qt,
                                                        (at) => {
                                                          e(A) && at(Ut);
                                                        },
                                                        !0
                                                      );
                                                    }
                                                    p(Ee, dt);
                                                  };
                                                S(
                                                  nt,
                                                  (Ee) => {
                                                    (e(A),
                                                      s(() => e(A)?.type === 'newItemMenu')
                                                        ? Ee(_t)
                                                        : Ee(St, !1));
                                                  },
                                                  !0
                                                );
                                              }
                                              p(Oe, Ne);
                                            };
                                          S(
                                            Ce,
                                            (Oe) => {
                                              (e(A),
                                                s(() => e(A)?.type === 'settings-backup')
                                                  ? Oe(mt)
                                                  : Oe(ft, !1));
                                            },
                                            !0
                                          );
                                        }
                                        p(De, Be);
                                      };
                                    S(
                                      Te,
                                      (De) => {
                                        (e(A),
                                          s(() => e(A)?.type === 'settings-companions')
                                            ? De(rt)
                                            : De(Pe, !1));
                                      },
                                      !0
                                    );
                                  }
                                  p(Fe, lt);
                                };
                              S(
                                xt,
                                (Fe) => {
                                  (e(A),
                                    s(() => e(A)?.type === 'settings-vouchers')
                                      ? Fe(x)
                                      : Fe(pt, !1));
                                },
                                !0
                              );
                            }
                            p(Le, We);
                          };
                        S(
                          ut,
                          (Le) => {
                            (e(A),
                              s(() => e(A)?.type === 'settings-security') ? Le(He) : Le(be, !1));
                          },
                          !0
                        );
                      }
                      p(Qe, et);
                    };
                  S(
                    ot,
                    (Qe) => {
                      (e(A), s(() => e(A)?.type === 'settings-profile') ? Qe(yt) : Qe(tt, !1));
                    },
                    !0
                  );
                }
                p(je, Ue);
              };
            S(de, (je) => {
              (e(A), s(() => e(A)?.type === 'calendar') ? je(Ie) : je(Me, !1));
            });
          }
          (t(_),
            V(
              () =>
                (q = Pt(_, 1, 'secondary-content svelte-x1i5gj', null, q, {
                  'full-width':
                    e(A)?.type === 'calendar' ||
                    e(A)?.type === 'settings-vouchers' ||
                    e(A)?.type === 'settings-companions' ||
                    e(A)?.type === 'settings-backup',
                }))
            ),
            p($, _));
        },
        tertiary: ($, T) => {
          var _ = fl(),
            q = a(_);
          {
            var de = (Me) => {
                var je = vl(),
                  Ue = oe(je),
                  ot = r(a(Ue), 2);
                t(Ue);
                var yt = r(Ue, 2),
                  tt = a(yt);
                {
                  let Qe = vt(() => (e(le), s(() => e(le).data?.voucher?.id))),
                    et = vt(() => (e(le), s(() => e(le).data?.voucher)));
                  Fr(tt, {
                    tripId: '',
                    get voucherId() {
                      return e(Qe);
                    },
                    get voucher() {
                      return e(et);
                    },
                    onSuccess: (ut) => {
                      pe();
                    },
                    onCancel: pe,
                  });
                }
                (t(yt), z('click', ot, pe), p(Me, je));
              },
              Ie = (Me) => {
                var je = he(),
                  Ue = oe(je);
                {
                  var ot = (tt) => {
                      var Qe = ul(),
                        et = oe(Qe),
                        ut = r(a(et), 2);
                      t(et);
                      var He = r(et, 2),
                        be = a(He);
                      (Fr(be, {
                        tripId: '',
                        voucherId: null,
                        voucher: null,
                        onSuccess: (Le) => {
                          pe();
                        },
                        onCancel: pe,
                      }),
                        t(He),
                        z('click', ut, pe),
                        p(tt, Qe));
                    },
                    yt = (tt) => {
                      var Qe = he(),
                        et = oe(Qe);
                      {
                        var ut = (be) => {
                            var Le = pl(),
                              We = oe(Le),
                              xt = r(a(We), 2);
                            t(We);
                            var x = r(We, 2),
                              pt = a(x);
                            (Yr(pt, {
                              companion: null,
                              onSuccess: (Fe) => {
                                (pe(),
                                  window.dispatchEvent(
                                    new CustomEvent('companions-updated', {
                                      detail: { companion: Fe },
                                    })
                                  ));
                              },
                              onCancel: pe,
                            }),
                              t(x),
                              z('click', xt, pe),
                              p(be, Le));
                          },
                          He = (be) => {
                            var Le = he(),
                              We = oe(Le);
                            {
                              var xt = (x) => {
                                var pt = ml(),
                                  Fe = oe(pt),
                                  lt = r(a(Fe), 2);
                                t(Fe);
                                var Te = r(Fe, 2),
                                  rt = a(Te);
                                {
                                  let Pe = vt(() => (e(le), s(() => e(le).data?.companion)));
                                  Yr(rt, {
                                    get companion() {
                                      return e(Pe);
                                    },
                                    onSuccess: (De) => {
                                      (pe(),
                                        window.dispatchEvent(
                                          new CustomEvent('companions-updated', {
                                            detail: { companion: De },
                                          })
                                        ));
                                    },
                                    onCancel: pe,
                                  });
                                }
                                (t(Te), z('click', lt, pe), p(x, pt));
                              };
                              S(
                                We,
                                (x) => {
                                  (e(le), s(() => e(le)?.type === 'edit-companion') && x(xt));
                                },
                                !0
                              );
                            }
                            p(be, Le);
                          };
                        S(
                          et,
                          (be) => {
                            (e(le), s(() => e(le)?.type === 'add-companion') ? be(ut) : be(He, !1));
                          },
                          !0
                        );
                      }
                      p(tt, Qe);
                    };
                  S(
                    Ue,
                    (tt) => {
                      (e(le), s(() => e(le)?.type === 'add-voucher') ? tt(ot) : tt(yt, !1));
                    },
                    !0
                  );
                }
                p(Me, je);
              };
            S(q, (Me) => {
              (e(le), s(() => e(le)?.type === 'edit-voucher') ? Me(de) : Me(Ie, !1));
            });
          }
          (t(_), p($, _));
        },
      },
    });
  }
  (ta(), C());
}
export { Ml as component };
