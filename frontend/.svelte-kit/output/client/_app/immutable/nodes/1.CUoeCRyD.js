import { f as c, a as r, t as q, c as F } from '../chunks/mgpANiac.js';
import { h as I } from '../chunks/C0UKtQpt.js';
import {
  A as G,
  C as s,
  Y as T,
  u as H,
  y as g,
  E as o,
  x as J,
  B as K,
  e as L,
  $ as M,
  n as W,
  z as N,
} from '../chunks/6VQ_8qfV.js';
import { i as h } from '../chunks/DWD46BZK.js';
import { i as Q } from '../chunks/D4j-cL-r.js';
import { s as R, a as U } from '../chunks/DOiyoGAd.js';
import { p as V } from '../chunks/BiPItUvm.js';
import { s as X, b as Z, B as Y } from '../chunks/DBddglCw.js';
import { e as ee, s as D } from '../chunks/BgKsp-fi.js';
import { a as re, s as O } from '../chunks/BjBIcaOF.js';
import { p as S } from '../chunks/CEvUO948.js';
var te = c('<h3 class="svelte-1udyrqm"> </h3>'),
  ae = c('<p class="subtitle svelte-1udyrqm"> </p>'),
  se = c('<div class="header-indicators svelte-1udyrqm"><!></div>'),
  oe = c(
    '<div class="card-header svelte-1udyrqm"><div class="header-content svelte-1udyrqm"><!> <!></div> <!></div>'
  ),
  ie = c('<div class="card-footer svelte-1udyrqm"><!></div>'),
  ve = c('<div><!> <div class="card-body svelte-1udyrqm"><!></div> <!></div>');
function le(j, v) {
  const f = re(v);
  let b = S(v, 'title', 8, ''),
    y = S(v, 'subtitle', 8, ''),
    x = S(v, 'clickable', 8, !1);
  var u = ve();
  let $;
  var B = s(u);
  {
    var k = (a) => {
      var l = oe(),
        _ = s(l),
        t = s(_);
      {
        var d = (e) => {
          var i = te(),
            w = s(i, !0);
          (o(i), G(() => D(w, b())), r(e, i));
        };
        h(t, (e) => {
          b() && e(d);
        });
      }
      var p = g(t, 2);
      {
        var A = (e) => {
          var i = ae(),
            w = s(i, !0);
          (o(i), G(() => D(w, y())), r(e, i));
        };
        h(p, (e) => {
          y() && e(A);
        });
      }
      o(_);
      var C = g(_, 2);
      {
        var n = (e) => {
          var i = se(),
            w = s(i);
          (O(w, v, 'indicators', {}), o(i), r(e, i));
        };
        h(C, (e) => {
          H(() => f.indicators) && e(n);
        });
      }
      (o(l), r(a, l));
    };
    h(B, (a) => {
      (T(b()), T(y()), H(() => b() || y() || f.indicators) && a(k));
    });
  }
  var m = g(B, 2),
    P = s(m);
  (O(P, v, 'default', {}), o(m));
  var E = g(m, 2);
  {
    var z = (a) => {
      var l = ie(),
        _ = s(l);
      (O(_, v, 'footer', {}), o(l), r(a, l));
    };
    h(E, (a) => {
      H(() => f.footer) && a(z);
    });
  }
  (o(u),
    G(() => ($ = X(u, 1, 'card svelte-1udyrqm', null, $, { clickable: x() }))),
    ee('click', u, function (a) {
      Z.call(this, v, a);
    }),
    r(j, u));
}
var de = c(
    '<div class="error-content svelte-1j96wlh"><p class="error-message svelte-1j96wlh"><!></p> <div class="error-actions svelte-1j96wlh"><!> <!></div></div>'
  ),
  ne = c('<div class="error-container svelte-1j96wlh"><!></div>');
function $e(j, v) {
  J(v, !1);
  const f = () => U(V, '$page', b),
    [b, y] = R();
  Q();
  var x = ne();
  I('1j96wlh', ($) => {
    L(() => {
      M.title = 'Error - Bluebonnet';
    });
  });
  var u = s(x);
  (le(u, {
    title: 'Oops! Something went wrong',
    get subtitle() {
      return `Error ${f().status ?? ''}`;
    },
    children: ($, B) => {
      var k = de(),
        m = s(k),
        P = s(m);
      {
        var E = (t) => {
            var d = q("The page you're looking for doesn't exist.");
            r(t, d);
          },
          z = (t) => {
            var d = F(),
              p = N(d);
            {
              var A = (n) => {
                  var e = q('We encountered an internal server error. Please try again later.');
                  r(n, e);
                },
                C = (n) => {
                  var e = q('An unexpected error occurred. Please try again.');
                  r(n, e);
                };
              h(
                p,
                (n) => {
                  f().status === 500 ? n(A) : n(C, !1);
                },
                !0
              );
            }
            r(t, d);
          };
        h(P, (t) => {
          f().status === 404 ? t(E) : t(z, !1);
        });
      }
      o(m);
      var a = g(m, 2),
        l = s(a);
      Y(l, {
        variant: 'primary',
        $$events: { click: () => (window.location.href = '/') },
        children: (t, d) => {
          W();
          var p = q('Go to Home');
          r(t, p);
        },
        $$slots: { default: !0 },
      });
      var _ = g(l, 2);
      (Y(_, {
        variant: 'secondary',
        $$events: { click: () => window.history.back() },
        children: (t, d) => {
          W();
          var p = q('Go Back');
          r(t, p);
        },
        $$slots: { default: !0 },
      }),
        o(a),
        o(k),
        r($, k));
    },
    $$slots: { default: !0 },
  }),
    o(x),
    r(j, x),
    K(),
    y());
}
export { $e as component };
