/*!
 * Webflow: Front-end site library
 * @license MIT
 * Inline scripts may access the api using an async handler:
 *   var Webflow = Webflow || [];
 *   Webflow.push(readyFunction);
 */ !(function (t) {
  var e = {};
  function n(i) {
    if (e[i]) return e[i].exports;
    var r = (e[i] = { i: i, l: !1, exports: {} });
    return t[i].call(r.exports, r, r.exports, n), (r.l = !0), r.exports;
  }
  (n.m = t),
    (n.c = e),
    (n.d = function (t, e, i) {
      n.o(t, e) || Object.defineProperty(t, e, { enumerable: !0, get: i });
    }),
    (n.r = function (t) {
      "undefined" != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }),
        Object.defineProperty(t, "__esModule", { value: !0 });
    }),
    (n.t = function (t, e) {
      if ((1 & e && (t = n(t)), 8 & e)) return t;
      if (4 & e && "object" == typeof t && t && t.__esModule) return t;
      var i = Object.create(null);
      if (
        (n.r(i),
        Object.defineProperty(i, "default", { enumerable: !0, value: t }),
        2 & e && "string" != typeof t)
      )
        for (var r in t)
          n.d(
            i,
            r,
            function (e) {
              return t[e];
            }.bind(null, r)
          );
      return i;
    }),
    (n.n = function (t) {
      var e =
        t && t.__esModule
          ? function () {
              return t.default;
            }
          : function () {
              return t;
            };
      return n.d(e, "a", e), e;
    }),
    (n.o = function (t, e) {
      return Object.prototype.hasOwnProperty.call(t, e);
    }),
    (n.p = ""),
    n((n.s = 6));
})([
  function (t, e, n) {
    "use strict";
    var i = {},
      r = {},
      o = [],
      a = window.Webflow || [],
      s = window.jQuery,
      u = s(window),
      c = s(document),
      l = s.isFunction,
      d = (i._ = n(9)),
      f = (i.tram = n(5) && s.tram),
      h = !1,
      p = !1;
    function v(t) {
      i.env() &&
        (l(t.design) && u.on("__wf_design", t.design),
        l(t.preview) && u.on("__wf_preview", t.preview)),
        l(t.destroy) && u.on("__wf_destroy", t.destroy),
        t.ready &&
          l(t.ready) &&
          (function (t) {
            if (h) return void t.ready();
            if (d.contains(o, t.ready)) return;
            o.push(t.ready);
          })(t);
    }
    function m(t) {
      l(t.design) && u.off("__wf_design", t.design),
        l(t.preview) && u.off("__wf_preview", t.preview),
        l(t.destroy) && u.off("__wf_destroy", t.destroy),
        t.ready &&
          l(t.ready) &&
          (function (t) {
            o = d.filter(o, function (e) {
              return e !== t.ready;
            });
          })(t);
    }
    (f.config.hideBackface = !1),
      (f.config.keepInherited = !0),
      (i.define = function (t, e, n) {
        r[t] && m(r[t]);
        var i = (r[t] = e(s, d, n) || {});
        return v(i), i;
      }),
      (i.require = function (t) {
        return r[t];
      }),
      (i.push = function (t) {
        h ? l(t) && t() : a.push(t);
      }),
      (i.env = function (t) {
        var e = window.__wf_design,
          n = void 0 !== e;
        return t
          ? "design" === t
            ? n && e
            : "preview" === t
            ? n && !e
            : "slug" === t
            ? n && window.__wf_slug
            : "editor" === t
            ? window.WebflowEditor
            : "test" === t
            ? window.__wf_test
            : "frame" === t
            ? window !== window.top
            : void 0
          : n;
      });
    var g,
      w = navigator.userAgent.toLowerCase(),
      y = (i.env.touch =
        "ontouchstart" in window ||
        (window.DocumentTouch && document instanceof window.DocumentTouch)),
      b = (i.env.chrome =
        /chrome/.test(w) &&
        /Google/.test(navigator.vendor) &&
        parseInt(w.match(/chrome\/(\d+)\./)[1], 10)),
      x = (i.env.ios = /(ipod|iphone|ipad)/.test(w));
    (i.env.safari = /safari/.test(w) && !b && !x),
      y &&
        c.on("touchstart mousedown", function (t) {
          g = t.target;
        }),
      (i.validClick = y
        ? function (t) {
            return t === g || s.contains(t, g);
          }
        : function () {
            return !0;
          });
    var k,
      _ = "resize.webflow orientationchange.webflow load.webflow";
    function O(t, e) {
      var n = [],
        i = {};
      return (
        (i.up = d.throttle(function (t) {
          d.each(n, function (e) {
            e(t);
          });
        })),
        t && e && t.on(e, i.up),
        (i.on = function (t) {
          "function" == typeof t && (d.contains(n, t) || n.push(t));
        }),
        (i.off = function (t) {
          n = arguments.length
            ? d.filter(n, function (e) {
                return e !== t;
              })
            : [];
        }),
        i
      );
    }
    function E(t) {
      l(t) && t();
    }
    function A() {
      k && (k.reject(), u.off("load", k.resolve)),
        (k = new s.Deferred()),
        u.on("load", k.resolve);
    }
    (i.resize = O(u, _)),
      (i.scroll = O(
        u,
        "scroll.webflow resize.webflow orientationchange.webflow load.webflow"
      )),
      (i.redraw = O()),
      (i.location = function (t) {
        window.location = t;
      }),
      i.env() && (i.location = function () {}),
      (i.ready = function () {
        (h = !0),
          p ? ((p = !1), d.each(r, v)) : d.each(o, E),
          d.each(a, E),
          i.resize.up();
      }),
      (i.load = function (t) {
        k.then(t);
      }),
      (i.destroy = function (t) {
        (t = t || {}),
          (p = !0),
          u.triggerHandler("__wf_destroy"),
          null != t.domready && (h = t.domready),
          d.each(r, m),
          i.resize.off(),
          i.scroll.off(),
          i.redraw.off(),
          (o = []),
          (a = []),
          "pending" === k.state() && A();
      }),
      s(i.ready),
      A(),
      (t.exports = window.Webflow = i);
  },
  function (t, e, n) {
    "use strict";
    var i = n(3);
    function r(t, e) {
      var n = document.createEvent("CustomEvent");
      n.initCustomEvent(e, !0, !0, null), t.dispatchEvent(n);
    }
    var o = window.jQuery,
      a = {},
      s = {
        reset: function (t, e) {
          i.triggers.reset(t, e);
        },
        intro: function (t, e) {
          i.triggers.intro(t, e), r(e, "COMPONENT_ACTIVE");
        },
        outro: function (t, e) {
          i.triggers.outro(t, e), r(e, "COMPONENT_INACTIVE");
        },
      };
    (a.triggers = {}),
      (a.types = { INTRO: "w-ix-intro.w-ix", OUTRO: "w-ix-outro.w-ix" }),
      o.extend(a.triggers, s),
      (t.exports = a);
  },
  function (t, e) {
    t.exports = function (t) {
      return t && t.__esModule ? t : { default: t };
    };
  },
  function (t, e, n) {
    "use strict";
    var i = window.jQuery,
      r = {},
      o = [],
      a = {
        reset: function (t, e) {
          e.__wf_intro = null;
        },
        intro: function (t, e) {
          e.__wf_intro ||
            ((e.__wf_intro = !0), i(e).triggerHandler(r.types.INTRO));
        },
        outro: function (t, e) {
          e.__wf_intro &&
            ((e.__wf_intro = null), i(e).triggerHandler(r.types.OUTRO));
        },
      };
    (r.triggers = {}),
      (r.types = { INTRO: "w-ix-intro.w-ix", OUTRO: "w-ix-outro.w-ix" }),
      (r.init = function () {
        for (var t = o.length, e = 0; e < t; e++) {
          var n = o[e];
          n[0](0, n[1]);
        }
        (o = []), i.extend(r.triggers, a);
      }),
      (r.async = function () {
        for (var t in a) {
          var e = a[t];
          a.hasOwnProperty(t) &&
            (r.triggers[t] = function (t, n) {
              o.push([e, n]);
            });
        }
      }),
      r.async(),
      (t.exports = r);
  },
  function (t, e) {
    function n(t) {
      return (n =
        "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
          ? function (t) {
              return typeof t;
            }
          : function (t) {
              return t &&
                "function" == typeof Symbol &&
                t.constructor === Symbol &&
                t !== Symbol.prototype
                ? "symbol"
                : typeof t;
            })(t);
    }
    function i(e) {
      return (
        "function" == typeof Symbol && "symbol" === n(Symbol.iterator)
          ? (t.exports = i =
              function (t) {
                return n(t);
              })
          : (t.exports = i =
              function (t) {
                return t &&
                  "function" == typeof Symbol &&
                  t.constructor === Symbol &&
                  t !== Symbol.prototype
                  ? "symbol"
                  : n(t);
              }),
        i(e)
      );
    }
    t.exports = i;
  },
  function (t, e, n) {
    "use strict";
    var i = n(2)(n(4));
    window.tram = (function (t) {
      function e(t, e) {
        return new j.Bare().init(t, e);
      }
      function n(t) {
        return t.replace(/[A-Z]/g, function (t) {
          return "-" + t.toLowerCase();
        });
      }
      function r(t) {
        var e = parseInt(t.slice(1), 16);
        return [(e >> 16) & 255, (e >> 8) & 255, 255 & e];
      }
      function o(t, e, n) {
        return (
          "#" + ((1 << 24) | (t << 16) | (e << 8) | n).toString(16).slice(1)
        );
      }
      function a() {}
      function s(t, e, n) {
        c("Units do not match [" + t + "]: " + e + ", " + n);
      }
      function u(t, e, n) {
        if ((void 0 !== e && (n = e), void 0 === t)) return n;
        var i = n;
        return (
          K.test(t) || !Q.test(t)
            ? (i = parseInt(t, 10))
            : Q.test(t) && (i = 1e3 * parseFloat(t)),
          0 > i && (i = 0),
          i == i ? i : n
        );
      }
      function c(t) {
        B.debug && window && window.console.warn(t);
      }
      var l = (function (t, e, n) {
          function r(t) {
            return "object" == (0, i.default)(t);
          }
          function o(t) {
            return "function" == typeof t;
          }
          function a() {}
          return function i(s, u) {
            function c() {
              var t = new l();
              return o(t.init) && t.init.apply(t, arguments), t;
            }
            function l() {}
            u === n && ((u = s), (s = Object)), (c.Bare = l);
            var d,
              f = (a[t] = s[t]),
              h = (l[t] = c[t] = new a());
            return (
              (h.constructor = c),
              (c.mixin = function (e) {
                return (l[t] = c[t] = i(c, e)[t]), c;
              }),
              (c.open = function (t) {
                if (
                  ((d = {}),
                  o(t) ? (d = t.call(c, h, f, c, s)) : r(t) && (d = t),
                  r(d))
                )
                  for (var n in d) e.call(d, n) && (h[n] = d[n]);
                return o(h.init) || (h.init = s), c;
              }),
              c.open(u)
            );
          };
        })("prototype", {}.hasOwnProperty),
        d = {
          ease: [
            "ease",
            function (t, e, n, i) {
              var r = (t /= i) * t,
                o = r * t;
              return (
                e +
                n * (-2.75 * o * r + 11 * r * r + -15.5 * o + 8 * r + 0.25 * t)
              );
            },
          ],
          "ease-in": [
            "ease-in",
            function (t, e, n, i) {
              var r = (t /= i) * t,
                o = r * t;
              return e + n * (-1 * o * r + 3 * r * r + -3 * o + 2 * r);
            },
          ],
          "ease-out": [
            "ease-out",
            function (t, e, n, i) {
              var r = (t /= i) * t,
                o = r * t;
              return (
                e +
                n * (0.3 * o * r + -1.6 * r * r + 2.2 * o + -1.8 * r + 1.9 * t)
              );
            },
          ],
          "ease-in-out": [
            "ease-in-out",
            function (t, e, n, i) {
              var r = (t /= i) * t,
                o = r * t;
              return e + n * (2 * o * r + -5 * r * r + 2 * o + 2 * r);
            },
          ],
          linear: [
            "linear",
            function (t, e, n, i) {
              return (n * t) / i + e;
            },
          ],
          "ease-in-quad": [
            "cubic-bezier(0.550, 0.085, 0.680, 0.530)",
            function (t, e, n, i) {
              return n * (t /= i) * t + e;
            },
          ],
          "ease-out-quad": [
            "cubic-bezier(0.250, 0.460, 0.450, 0.940)",
            function (t, e, n, i) {
              return -n * (t /= i) * (t - 2) + e;
            },
          ],
          "ease-in-out-quad": [
            "cubic-bezier(0.455, 0.030, 0.515, 0.955)",
            function (t, e, n, i) {
              return (t /= i / 2) < 1
                ? (n / 2) * t * t + e
                : (-n / 2) * (--t * (t - 2) - 1) + e;
            },
          ],
          "ease-in-cubic": [
            "cubic-bezier(0.550, 0.055, 0.675, 0.190)",
            function (t, e, n, i) {
              return n * (t /= i) * t * t + e;
            },
          ],
          "ease-out-cubic": [
            "cubic-bezier(0.215, 0.610, 0.355, 1)",
            function (t, e, n, i) {
              return n * ((t = t / i - 1) * t * t + 1) + e;
            },
          ],
          "ease-in-out-cubic": [
            "cubic-bezier(0.645, 0.045, 0.355, 1)",
            function (t, e, n, i) {
              return (t /= i / 2) < 1
                ? (n / 2) * t * t * t + e
                : (n / 2) * ((t -= 2) * t * t + 2) + e;
            },
          ],
          "ease-in-quart": [
            "cubic-bezier(0.895, 0.030, 0.685, 0.220)",
            function (t, e, n, i) {
              return n * (t /= i) * t * t * t + e;
            },
          ],
          "ease-out-quart": [
            "cubic-bezier(0.165, 0.840, 0.440, 1)",
            function (t, e, n, i) {
              return -n * ((t = t / i - 1) * t * t * t - 1) + e;
            },
          ],
          "ease-in-out-quart": [
            "cubic-bezier(0.770, 0, 0.175, 1)",
            function (t, e, n, i) {
              return (t /= i / 2) < 1
                ? (n / 2) * t * t * t * t + e
                : (-n / 2) * ((t -= 2) * t * t * t - 2) + e;
            },
          ],
          "ease-in-quint": [
            "cubic-bezier(0.755, 0.050, 0.855, 0.060)",
            function (t, e, n, i) {
              return n * (t /= i) * t * t * t * t + e;
            },
          ],
          "ease-out-quint": [
            "cubic-bezier(0.230, 1, 0.320, 1)",
            function (t, e, n, i) {
              return n * ((t = t / i - 1) * t * t * t * t + 1) + e;
            },
          ],
          "ease-in-out-quint": [
            "cubic-bezier(0.860, 0, 0.070, 1)",
            function (t, e, n, i) {
              return (t /= i / 2) < 1
                ? (n / 2) * t * t * t * t * t + e
                : (n / 2) * ((t -= 2) * t * t * t * t + 2) + e;
            },
          ],
          "ease-in-sine": [
            "cubic-bezier(0.470, 0, 0.745, 0.715)",
            function (t, e, n, i) {
              return -n * Math.cos((t / i) * (Math.PI / 2)) + n + e;
            },
          ],
          "ease-out-sine": [
            "cubic-bezier(0.390, 0.575, 0.565, 1)",
            function (t, e, n, i) {
              return n * Math.sin((t / i) * (Math.PI / 2)) + e;
            },
          ],
          "ease-in-out-sine": [
            "cubic-bezier(0.445, 0.050, 0.550, 0.950)",
            function (t, e, n, i) {
              return (-n / 2) * (Math.cos((Math.PI * t) / i) - 1) + e;
            },
          ],
          "ease-in-expo": [
            "cubic-bezier(0.950, 0.050, 0.795, 0.035)",
            function (t, e, n, i) {
              return 0 === t ? e : n * Math.pow(2, 10 * (t / i - 1)) + e;
            },
          ],
          "ease-out-expo": [
            "cubic-bezier(0.190, 1, 0.220, 1)",
            function (t, e, n, i) {
              return t === i ? e + n : n * (1 - Math.pow(2, (-10 * t) / i)) + e;
            },
          ],
          "ease-in-out-expo": [
            "cubic-bezier(1, 0, 0, 1)",
            function (t, e, n, i) {
              return 0 === t
                ? e
                : t === i
                ? e + n
                : (t /= i / 2) < 1
                ? (n / 2) * Math.pow(2, 10 * (t - 1)) + e
                : (n / 2) * (2 - Math.pow(2, -10 * --t)) + e;
            },
          ],
          "ease-in-circ": [
            "cubic-bezier(0.600, 0.040, 0.980, 0.335)",
            function (t, e, n, i) {
              return -n * (Math.sqrt(1 - (t /= i) * t) - 1) + e;
            },
          ],
          "ease-out-circ": [
            "cubic-bezier(0.075, 0.820, 0.165, 1)",
            function (t, e, n, i) {
              return n * Math.sqrt(1 - (t = t / i - 1) * t) + e;
            },
          ],
          "ease-in-out-circ": [
            "cubic-bezier(0.785, 0.135, 0.150, 0.860)",
            function (t, e, n, i) {
              return (t /= i / 2) < 1
                ? (-n / 2) * (Math.sqrt(1 - t * t) - 1) + e
                : (n / 2) * (Math.sqrt(1 - (t -= 2) * t) + 1) + e;
            },
          ],
          "ease-in-back": [
            "cubic-bezier(0.600, -0.280, 0.735, 0.045)",
            function (t, e, n, i, r) {
              return (
                void 0 === r && (r = 1.70158),
                n * (t /= i) * t * ((r + 1) * t - r) + e
              );
            },
          ],
          "ease-out-back": [
            "cubic-bezier(0.175, 0.885, 0.320, 1.275)",
            function (t, e, n, i, r) {
              return (
                void 0 === r && (r = 1.70158),
                n * ((t = t / i - 1) * t * ((r + 1) * t + r) + 1) + e
              );
            },
          ],
          "ease-in-out-back": [
            "cubic-bezier(0.680, -0.550, 0.265, 1.550)",
            function (t, e, n, i, r) {
              return (
                void 0 === r && (r = 1.70158),
                (t /= i / 2) < 1
                  ? (n / 2) * t * t * ((1 + (r *= 1.525)) * t - r) + e
                  : (n / 2) *
                      ((t -= 2) * t * ((1 + (r *= 1.525)) * t + r) + 2) +
                    e
              );
            },
          ],
        },
        f = {
          "ease-in-back": "cubic-bezier(0.600, 0, 0.735, 0.045)",
          "ease-out-back": "cubic-bezier(0.175, 0.885, 0.320, 1)",
          "ease-in-out-back": "cubic-bezier(0.680, 0, 0.265, 1)",
        },
        h = document,
        p = window,
        v = "bkwld-tram",
        m = /[\-\.0-9]/g,
        g = /[A-Z]/,
        w = "number",
        y = /^(rgb|#)/,
        b = /(em|cm|mm|in|pt|pc|px)$/,
        x = /(em|cm|mm|in|pt|pc|px|%)$/,
        k = /(deg|rad|turn)$/,
        _ = "unitless",
        O = /(all|none) 0s ease 0s/,
        E = /^(width|height)$/,
        A = " ",
        T = h.createElement("a"),
        C = ["Webkit", "Moz", "O", "ms"],
        I = ["-webkit-", "-moz-", "-o-", "-ms-"],
        R = function (t) {
          if (t in T.style) return { dom: t, css: t };
          var e,
            n,
            i = "",
            r = t.split("-");
          for (e = 0; e < r.length; e++)
            i += r[e].charAt(0).toUpperCase() + r[e].slice(1);
          for (e = 0; e < C.length; e++)
            if ((n = C[e] + i) in T.style) return { dom: n, css: I[e] + t };
        },
        S = (e.support = {
          bind: Function.prototype.bind,
          transform: R("transform"),
          transition: R("transition"),
          backface: R("backface-visibility"),
          timing: R("transition-timing-function"),
        });
      if (S.transition) {
        var L = S.timing.dom;
        if (((T.style[L] = d["ease-in-back"][0]), !T.style[L]))
          for (var z in f) d[z][0] = f[z];
      }
      var M = (e.frame = (function () {
          var t =
            p.requestAnimationFrame ||
            p.webkitRequestAnimationFrame ||
            p.mozRequestAnimationFrame ||
            p.oRequestAnimationFrame ||
            p.msRequestAnimationFrame;
          return t && S.bind
            ? t.bind(p)
            : function (t) {
                p.setTimeout(t, 16);
              };
        })()),
        P = (e.now = (function () {
          var t = p.performance,
            e = t && (t.now || t.webkitNow || t.msNow || t.mozNow);
          return e && S.bind
            ? e.bind(t)
            : Date.now ||
                function () {
                  return +new Date();
                };
        })()),
        D = l(function (e) {
          function r(t, e) {
            var n = (function (t) {
                for (var e = -1, n = t ? t.length : 0, i = []; ++e < n; ) {
                  var r = t[e];
                  r && i.push(r);
                }
                return i;
              })(("" + t).split(A)),
              i = n[0];
            e = e || {};
            var r = V[i];
            if (!r) return c("Unsupported property: " + i);
            if (!e.weak || !this.props[i]) {
              var o = r[0],
                a = this.props[i];
              return (
                a || (a = this.props[i] = new o.Bare()),
                a.init(this.$el, n, r, e),
                a
              );
            }
          }
          function o(t, e, n) {
            if (t) {
              var o = (0, i.default)(t);
              if (
                (e ||
                  (this.timer && this.timer.destroy(),
                  (this.queue = []),
                  (this.active = !1)),
                "number" == o && e)
              )
                return (
                  (this.timer = new U({
                    duration: t,
                    context: this,
                    complete: a,
                  })),
                  void (this.active = !0)
                );
              if ("string" == o && e) {
                switch (t) {
                  case "hide":
                    l.call(this);
                    break;
                  case "stop":
                    s.call(this);
                    break;
                  case "redraw":
                    d.call(this);
                    break;
                  default:
                    r.call(this, t, n && n[1]);
                }
                return a.call(this);
              }
              if ("function" == o) return void t.call(this, this);
              if ("object" == o) {
                var c = 0;
                h.call(
                  this,
                  t,
                  function (t, e) {
                    t.span > c && (c = t.span), t.stop(), t.animate(e);
                  },
                  function (t) {
                    "wait" in t && (c = u(t.wait, 0));
                  }
                ),
                  f.call(this),
                  c > 0 &&
                    ((this.timer = new U({ duration: c, context: this })),
                    (this.active = !0),
                    e && (this.timer.complete = a));
                var p = this,
                  v = !1,
                  m = {};
                M(function () {
                  h.call(p, t, function (t) {
                    t.active && ((v = !0), (m[t.name] = t.nextStyle));
                  }),
                    v && p.$el.css(m);
                });
              }
            }
          }
          function a() {
            if (
              (this.timer && this.timer.destroy(),
              (this.active = !1),
              this.queue.length)
            ) {
              var t = this.queue.shift();
              o.call(this, t.options, !0, t.args);
            }
          }
          function s(t) {
            var e;
            this.timer && this.timer.destroy(),
              (this.queue = []),
              (this.active = !1),
              "string" == typeof t
                ? ((e = {})[t] = 1)
                : (e =
                    "object" == (0, i.default)(t) && null != t
                      ? t
                      : this.props),
              h.call(this, e, p),
              f.call(this);
          }
          function l() {
            s.call(this), (this.el.style.display = "none");
          }
          function d() {
            this.el.offsetHeight;
          }
          function f() {
            var t,
              e,
              n = [];
            for (t in (this.upstream && n.push(this.upstream), this.props))
              (e = this.props[t]).active && n.push(e.string);
            (n = n.join(",")),
              this.style !== n &&
                ((this.style = n), (this.el.style[S.transition.dom] = n));
          }
          function h(t, e, i) {
            var o,
              a,
              s,
              u,
              c = e !== p,
              l = {};
            for (o in t)
              (s = t[o]),
                o in Y
                  ? (l.transform || (l.transform = {}), (l.transform[o] = s))
                  : (g.test(o) && (o = n(o)),
                    o in V ? (l[o] = s) : (u || (u = {}), (u[o] = s)));
            for (o in l) {
              if (((s = l[o]), !(a = this.props[o]))) {
                if (!c) continue;
                a = r.call(this, o);
              }
              e.call(this, a, s);
            }
            i && u && i.call(this, u);
          }
          function p(t) {
            t.stop();
          }
          function m(t, e) {
            t.set(e);
          }
          function w(t) {
            this.$el.css(t);
          }
          function y(t, n) {
            e[t] = function () {
              return this.children
                ? function (t, e) {
                    var n,
                      i = this.children.length;
                    for (n = 0; i > n; n++) t.apply(this.children[n], e);
                    return this;
                  }.call(this, n, arguments)
                : (this.el && n.apply(this, arguments), this);
            };
          }
          (e.init = function (e) {
            if (
              ((this.$el = t(e)),
              (this.el = this.$el[0]),
              (this.props = {}),
              (this.queue = []),
              (this.style = ""),
              (this.active = !1),
              B.keepInherited && !B.fallback)
            ) {
              var n = Z(this.el, "transition");
              n && !O.test(n) && (this.upstream = n);
            }
            S.backface &&
              B.hideBackface &&
              X(this.el, S.backface.css, "hidden");
          }),
            y("add", r),
            y("start", o),
            y("wait", function (t) {
              (t = u(t, 0)),
                this.active
                  ? this.queue.push({ options: t })
                  : ((this.timer = new U({
                      duration: t,
                      context: this,
                      complete: a,
                    })),
                    (this.active = !0));
            }),
            y("then", function (t) {
              return this.active
                ? (this.queue.push({ options: t, args: arguments }),
                  void (this.timer.complete = a))
                : c(
                    "No active transition timer. Use start() or wait() before then()."
                  );
            }),
            y("next", a),
            y("stop", s),
            y("set", function (t) {
              s.call(this, t), h.call(this, t, m, w);
            }),
            y("show", function (t) {
              "string" != typeof t && (t = "block"),
                (this.el.style.display = t);
            }),
            y("hide", l),
            y("redraw", d),
            y("destroy", function () {
              s.call(this),
                t.removeData(this.el, v),
                (this.$el = this.el = null);
            });
        }),
        j = l(D, function (e) {
          function n(e, n) {
            var i = t.data(e, v) || t.data(e, v, new D.Bare());
            return i.el || i.init(e), n ? i.start(n) : i;
          }
          e.init = function (e, i) {
            var r = t(e);
            if (!r.length) return this;
            if (1 === r.length) return n(r[0], i);
            var o = [];
            return (
              r.each(function (t, e) {
                o.push(n(e, i));
              }),
              (this.children = o),
              this
            );
          };
        }),
        N = l(function (t) {
          function e() {
            var t = this.get();
            this.update("auto");
            var e = this.get();
            return this.update(t), e;
          }
          function n(t) {
            var e = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(t);
            return (e ? o(e[1], e[2], e[3]) : t).replace(
              /#(\w)(\w)(\w)$/,
              "#$1$1$2$2$3$3"
            );
          }
          var r = 500,
            a = "ease",
            s = 0;
          (t.init = function (t, e, n, i) {
            (this.$el = t), (this.el = t[0]);
            var o = e[0];
            n[2] && (o = n[2]),
              G[o] && (o = G[o]),
              (this.name = o),
              (this.type = n[1]),
              (this.duration = u(e[1], this.duration, r)),
              (this.ease = (function (t, e, n) {
                return void 0 !== e && (n = e), t in d ? t : n;
              })(e[2], this.ease, a)),
              (this.delay = u(e[3], this.delay, s)),
              (this.span = this.duration + this.delay),
              (this.active = !1),
              (this.nextStyle = null),
              (this.auto = E.test(this.name)),
              (this.unit = i.unit || this.unit || B.defaultUnit),
              (this.angle = i.angle || this.angle || B.defaultAngle),
              B.fallback || i.fallback
                ? (this.animate = this.fallback)
                : ((this.animate = this.transition),
                  (this.string =
                    this.name +
                    A +
                    this.duration +
                    "ms" +
                    ("ease" != this.ease ? A + d[this.ease][0] : "") +
                    (this.delay ? A + this.delay + "ms" : "")));
          }),
            (t.set = function (t) {
              (t = this.convert(t, this.type)), this.update(t), this.redraw();
            }),
            (t.transition = function (t) {
              (this.active = !0),
                (t = this.convert(t, this.type)),
                this.auto &&
                  ("auto" == this.el.style[this.name] &&
                    (this.update(this.get()), this.redraw()),
                  "auto" == t && (t = e.call(this))),
                (this.nextStyle = t);
            }),
            (t.fallback = function (t) {
              var n =
                this.el.style[this.name] || this.convert(this.get(), this.type);
              (t = this.convert(t, this.type)),
                this.auto &&
                  ("auto" == n && (n = this.convert(this.get(), this.type)),
                  "auto" == t && (t = e.call(this))),
                (this.tween = new H({
                  from: n,
                  to: t,
                  duration: this.duration,
                  delay: this.delay,
                  ease: this.ease,
                  update: this.update,
                  context: this,
                }));
            }),
            (t.get = function () {
              return Z(this.el, this.name);
            }),
            (t.update = function (t) {
              X(this.el, this.name, t);
            }),
            (t.stop = function () {
              (this.active || this.nextStyle) &&
                ((this.active = !1),
                (this.nextStyle = null),
                X(this.el, this.name, this.get()));
              var t = this.tween;
              t && t.context && t.destroy();
            }),
            (t.convert = function (t, e) {
              if ("auto" == t && this.auto) return t;
              var r,
                o = "number" == typeof t,
                a = "string" == typeof t;
              switch (e) {
                case w:
                  if (o) return t;
                  if (a && "" === t.replace(m, "")) return +t;
                  r = "number(unitless)";
                  break;
                case y:
                  if (a) {
                    if ("" === t && this.original) return this.original;
                    if (e.test(t))
                      return "#" == t.charAt(0) && 7 == t.length ? t : n(t);
                  }
                  r = "hex or rgb string";
                  break;
                case b:
                  if (o) return t + this.unit;
                  if (a && e.test(t)) return t;
                  r = "number(px) or string(unit)";
                  break;
                case x:
                  if (o) return t + this.unit;
                  if (a && e.test(t)) return t;
                  r = "number(px) or string(unit or %)";
                  break;
                case k:
                  if (o) return t + this.angle;
                  if (a && e.test(t)) return t;
                  r = "number(deg) or string(angle)";
                  break;
                case _:
                  if (o) return t;
                  if (a && x.test(t)) return t;
                  r = "number(unitless) or string(unit or %)";
              }
              return (
                (function (t, e) {
                  c(
                    "Type warning: Expected: [" +
                      t +
                      "] Got: [" +
                      (0, i.default)(e) +
                      "] " +
                      e
                  );
                })(r, t),
                t
              );
            }),
            (t.redraw = function () {
              this.el.offsetHeight;
            });
        }),
        W = l(N, function (t, e) {
          t.init = function () {
            e.init.apply(this, arguments),
              this.original || (this.original = this.convert(this.get(), y));
          };
        }),
        F = l(N, function (t, e) {
          (t.init = function () {
            e.init.apply(this, arguments), (this.animate = this.fallback);
          }),
            (t.get = function () {
              return this.$el[this.name]();
            }),
            (t.update = function (t) {
              this.$el[this.name](t);
            });
        }),
        q = l(N, function (t, e) {
          function n(t, e) {
            var n, i, r, o, a;
            for (n in t)
              (r = (o = Y[n])[0]),
                (i = o[1] || n),
                (a = this.convert(t[n], r)),
                e.call(this, i, a, r);
          }
          (t.init = function () {
            e.init.apply(this, arguments),
              this.current ||
                ((this.current = {}),
                Y.perspective &&
                  B.perspective &&
                  ((this.current.perspective = B.perspective),
                  X(this.el, this.name, this.style(this.current)),
                  this.redraw()));
          }),
            (t.set = function (t) {
              n.call(this, t, function (t, e) {
                this.current[t] = e;
              }),
                X(this.el, this.name, this.style(this.current)),
                this.redraw();
            }),
            (t.transition = function (t) {
              var e = this.values(t);
              this.tween = new $({
                current: this.current,
                values: e,
                duration: this.duration,
                delay: this.delay,
                ease: this.ease,
              });
              var n,
                i = {};
              for (n in this.current) i[n] = n in e ? e[n] : this.current[n];
              (this.active = !0), (this.nextStyle = this.style(i));
            }),
            (t.fallback = function (t) {
              var e = this.values(t);
              this.tween = new $({
                current: this.current,
                values: e,
                duration: this.duration,
                delay: this.delay,
                ease: this.ease,
                update: this.update,
                context: this,
              });
            }),
            (t.update = function () {
              X(this.el, this.name, this.style(this.current));
            }),
            (t.style = function (t) {
              var e,
                n = "";
              for (e in t) n += e + "(" + t[e] + ") ";
              return n;
            }),
            (t.values = function (t) {
              var e,
                i = {};
              return (
                n.call(this, t, function (t, n, r) {
                  (i[t] = n),
                    void 0 === this.current[t] &&
                      ((e = 0),
                      ~t.indexOf("scale") && (e = 1),
                      (this.current[t] = this.convert(e, r)));
                }),
                i
              );
            });
        }),
        H = l(function (e) {
          function n() {
            var t,
              e,
              i,
              r = u.length;
            if (r) for (M(n), e = P(), t = r; t--; ) (i = u[t]) && i.render(e);
          }
          var i = { ease: d.ease[1], from: 0, to: 1 };
          (e.init = function (t) {
            (this.duration = t.duration || 0), (this.delay = t.delay || 0);
            var e = t.ease || i.ease;
            d[e] && (e = d[e][1]),
              "function" != typeof e && (e = i.ease),
              (this.ease = e),
              (this.update = t.update || a),
              (this.complete = t.complete || a),
              (this.context = t.context || this),
              (this.name = t.name);
            var n = t.from,
              r = t.to;
            void 0 === n && (n = i.from),
              void 0 === r && (r = i.to),
              (this.unit = t.unit || ""),
              "number" == typeof n && "number" == typeof r
                ? ((this.begin = n), (this.change = r - n))
                : this.format(r, n),
              (this.value = this.begin + this.unit),
              (this.start = P()),
              !1 !== t.autoplay && this.play();
          }),
            (e.play = function () {
              var t;
              this.active ||
                (this.start || (this.start = P()),
                (this.active = !0),
                (t = this),
                1 === u.push(t) && M(n));
            }),
            (e.stop = function () {
              var e, n, i;
              this.active &&
                ((this.active = !1),
                (e = this),
                (i = t.inArray(e, u)) >= 0 &&
                  ((n = u.slice(i + 1)),
                  (u.length = i),
                  n.length && (u = u.concat(n))));
            }),
            (e.render = function (t) {
              var e,
                n = t - this.start;
              if (this.delay) {
                if (n <= this.delay) return;
                n -= this.delay;
              }
              if (n < this.duration) {
                var i = this.ease(n, 0, 1, this.duration);
                return (
                  (e = this.startRGB
                    ? (function (t, e, n) {
                        return o(
                          t[0] + n * (e[0] - t[0]),
                          t[1] + n * (e[1] - t[1]),
                          t[2] + n * (e[2] - t[2])
                        );
                      })(this.startRGB, this.endRGB, i)
                    : (function (t) {
                        return Math.round(t * c) / c;
                      })(this.begin + i * this.change)),
                  (this.value = e + this.unit),
                  void this.update.call(this.context, this.value)
                );
              }
              (e = this.endHex || this.begin + this.change),
                (this.value = e + this.unit),
                this.update.call(this.context, this.value),
                this.complete.call(this.context),
                this.destroy();
            }),
            (e.format = function (t, e) {
              if (((e += ""), "#" == (t += "").charAt(0)))
                return (
                  (this.startRGB = r(e)),
                  (this.endRGB = r(t)),
                  (this.endHex = t),
                  (this.begin = 0),
                  void (this.change = 1)
                );
              if (!this.unit) {
                var n = e.replace(m, "");
                n !== t.replace(m, "") && s("tween", e, t), (this.unit = n);
              }
              (e = parseFloat(e)),
                (t = parseFloat(t)),
                (this.begin = this.value = e),
                (this.change = t - e);
            }),
            (e.destroy = function () {
              this.stop(),
                (this.context = null),
                (this.ease = this.update = this.complete = a);
            });
          var u = [],
            c = 1e3;
        }),
        U = l(H, function (t) {
          (t.init = function (t) {
            (this.duration = t.duration || 0),
              (this.complete = t.complete || a),
              (this.context = t.context),
              this.play();
          }),
            (t.render = function (t) {
              t - this.start < this.duration ||
                (this.complete.call(this.context), this.destroy());
            });
        }),
        $ = l(H, function (t, e) {
          (t.init = function (t) {
            var e, n;
            for (e in ((this.context = t.context),
            (this.update = t.update),
            (this.tweens = []),
            (this.current = t.current),
            t.values))
              (n = t.values[e]),
                this.current[e] !== n &&
                  this.tweens.push(
                    new H({
                      name: e,
                      from: this.current[e],
                      to: n,
                      duration: t.duration,
                      delay: t.delay,
                      ease: t.ease,
                      autoplay: !1,
                    })
                  );
            this.play();
          }),
            (t.render = function (t) {
              var e,
                n,
                i = !1;
              for (e = this.tweens.length; e--; )
                (n = this.tweens[e]).context &&
                  (n.render(t), (this.current[n.name] = n.value), (i = !0));
              return i
                ? void (this.update && this.update.call(this.context))
                : this.destroy();
            }),
            (t.destroy = function () {
              if ((e.destroy.call(this), this.tweens)) {
                var t;
                for (t = this.tweens.length; t--; ) this.tweens[t].destroy();
                (this.tweens = null), (this.current = null);
              }
            });
        }),
        B = (e.config = {
          debug: !1,
          defaultUnit: "px",
          defaultAngle: "deg",
          keepInherited: !1,
          hideBackface: !1,
          perspective: "",
          fallback: !S.transition,
          agentTests: [],
        });
      (e.fallback = function (t) {
        if (!S.transition) return (B.fallback = !0);
        B.agentTests.push("(" + t + ")");
        var e = new RegExp(B.agentTests.join("|"), "i");
        B.fallback = e.test(navigator.userAgent);
      }),
        e.fallback("6.0.[2-5] Safari"),
        (e.tween = function (t) {
          return new H(t);
        }),
        (e.delay = function (t, e, n) {
          return new U({ complete: e, duration: t, context: n });
        }),
        (t.fn.tram = function (t) {
          return e.call(null, this, t);
        });
      var X = t.style,
        Z = t.css,
        G = { transform: S.transform && S.transform.css },
        V = {
          color: [W, y],
          background: [W, y, "background-color"],
          "outline-color": [W, y],
          "border-color": [W, y],
          "border-top-color": [W, y],
          "border-right-color": [W, y],
          "border-bottom-color": [W, y],
          "border-left-color": [W, y],
          "border-width": [N, b],
          "border-top-width": [N, b],
          "border-right-width": [N, b],
          "border-bottom-width": [N, b],
          "border-left-width": [N, b],
          "border-spacing": [N, b],
          "letter-spacing": [N, b],
          margin: [N, b],
          "margin-top": [N, b],
          "margin-right": [N, b],
          "margin-bottom": [N, b],
          "margin-left": [N, b],
          padding: [N, b],
          "padding-top": [N, b],
          "padding-right": [N, b],
          "padding-bottom": [N, b],
          "padding-left": [N, b],
          "outline-width": [N, b],
          opacity: [N, w],
          top: [N, x],
          right: [N, x],
          bottom: [N, x],
          left: [N, x],
          "font-size": [N, x],
          "text-indent": [N, x],
          "word-spacing": [N, x],
          width: [N, x],
          "min-width": [N, x],
          "max-width": [N, x],
          height: [N, x],
          "min-height": [N, x],
          "max-height": [N, x],
          "line-height": [N, _],
          "scroll-top": [F, w, "scrollTop"],
          "scroll-left": [F, w, "scrollLeft"],
        },
        Y = {};
      S.transform &&
        ((V.transform = [q]),
        (Y = {
          x: [x, "translateX"],
          y: [x, "translateY"],
          rotate: [k],
          rotateX: [k],
          rotateY: [k],
          scale: [w],
          scaleX: [w],
          scaleY: [w],
          skew: [k],
          skewX: [k],
          skewY: [k],
        })),
        S.transform &&
          S.backface &&
          ((Y.z = [x, "translateZ"]),
          (Y.rotateZ = [k]),
          (Y.scaleZ = [w]),
          (Y.perspective = [b]));
      var K = /ms/,
        Q = /s|\./;
      return (t.tram = e);
    })(window.jQuery);
  },
  function (t, e, n) {
    n(7),
      n(8),
      n(10),
      n(3),
      n(11),
      n(12),
      n(13),
      n(14),
      n(15),
      n(16),
      n(21),
      n(22),
      n(23),
      (t.exports = n(24));
  },
  function (t, e, n) {
    "use strict";
    var i = n(2)(n(4));
    !(function () {
      if ("undefined" != typeof window) {
        var t = window.navigator.userAgent.match(/Edge\/(\d{2})\./),
          e = !!t && parseInt(t[1], 10) >= 16;
        if (!("objectFit" in document.documentElement.style != !1) || e) {
          var n = function (t) {
              var e = t.parentNode;
              !(function (t) {
                var e = window.getComputedStyle(t, null),
                  n = e.getPropertyValue("position"),
                  i = e.getPropertyValue("overflow"),
                  r = e.getPropertyValue("display");
                (n && "static" !== n) || (t.style.position = "relative"),
                  "hidden" !== i && (t.style.overflow = "hidden"),
                  (r && "inline" !== r) || (t.style.display = "block"),
                  0 === t.clientHeight && (t.style.height = "100%"),
                  -1 === t.className.indexOf("object-fit-polyfill") &&
                    (t.className += " object-fit-polyfill");
              })(e),
                (function (t) {
                  var e = window.getComputedStyle(t, null),
                    n = {
                      "max-width": "none",
                      "max-height": "none",
                      "min-width": "0px",
                      "min-height": "0px",
                      top: "auto",
                      right: "auto",
                      bottom: "auto",
                      left: "auto",
                      "margin-top": "0px",
                      "margin-right": "0px",
                      "margin-bottom": "0px",
                      "margin-left": "0px",
                    };
                  for (var i in n)
                    e.getPropertyValue(i) !== n[i] && (t.style[i] = n[i]);
                })(t),
                (t.style.position = "absolute"),
                (t.style.height = "100%"),
                (t.style.width = "auto"),
                t.clientWidth > e.clientWidth
                  ? ((t.style.top = "0"),
                    (t.style.marginTop = "0"),
                    (t.style.left = "50%"),
                    (t.style.marginLeft = t.clientWidth / -2 + "px"))
                  : ((t.style.width = "100%"),
                    (t.style.height = "auto"),
                    (t.style.left = "0"),
                    (t.style.marginLeft = "0"),
                    (t.style.top = "50%"),
                    (t.style.marginTop = t.clientHeight / -2 + "px"));
            },
            r = function (t) {
              if (void 0 === t || t instanceof Event)
                t = document.querySelectorAll("[data-object-fit]");
              else if (t && t.nodeName) t = [t];
              else {
                if (
                  "object" !== (0, i.default)(t) ||
                  !t.length ||
                  !t[0].nodeName
                )
                  return !1;
                t = t;
              }
              for (var r = 0; r < t.length; r++)
                if (t[r].nodeName) {
                  var o = t[r].nodeName.toLowerCase();
                  if ("img" === o) {
                    if (e) continue;
                    t[r].complete
                      ? n(t[r])
                      : t[r].addEventListener("load", function () {
                          n(this);
                        });
                  } else
                    "video" === o
                      ? t[r].readyState > 0
                        ? n(t[r])
                        : t[r].addEventListener("loadedmetadata", function () {
                            n(this);
                          })
                      : n(t[r]);
                }
              return !0;
            };
          "loading" === document.readyState
            ? document.addEventListener("DOMContentLoaded", r)
            : r(),
            window.addEventListener("resize", r),
            (window.objectFitPolyfill = r);
        } else
          window.objectFitPolyfill = function () {
            return !1;
          };
      }
    })();
  },
  function (t, e, n) {
    "use strict";
    var i = n(0);
    i.define(
      "brand",
      (t.exports = function (t) {
        var e,
          n = {},
          r = document,
          o = t("html"),
          a = t("body"),
          s = ".w-webflow-badge",
          u = window.location,
          c = /PhantomJS/i.test(navigator.userAgent),
          l =
            "fullscreenchange webkitfullscreenchange mozfullscreenchange msfullscreenchange";
        function d() {
          var n =
            r.fullScreen ||
            r.mozFullScreen ||
            r.webkitIsFullScreen ||
            r.msFullscreenElement ||
            Boolean(r.webkitFullscreenElement);
          t(e).attr("style", n ? "display: none !important;" : "");
        }
        function f() {
          var t = a.children(s),
            n = t.length && t.get(0) === e,
            r = i.env("editor");
          n ? r && t.remove() : (t.length && t.remove(), r || a.append(e));
        }
       
      })
    );
  },
  function (t, e, n) {
    "use strict";
    var i = window.$,
      r = n(5) && i.tram;
    /*!
     * Webflow._ (aka) Underscore.js 1.6.0 (custom build)
     * _.each
     * _.map
     * _.find
     * _.filter
     * _.any
     * _.contains
     * _.delay
     * _.defer
     * _.throttle (webflow)
     * _.debounce
     * _.keys
     * _.has
     * _.now
     *
     * http://underscorejs.org
     * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Underscore may be freely distributed under the MIT license.
     * @license MIT
     */
    t.exports = (function () {
      var t = { VERSION: "1.6.0-Webflow" },
        e = {},
        n = Array.prototype,
        i = Object.prototype,
        o = Function.prototype,
        a = (n.push, n.slice),
        s = (n.concat, i.toString, i.hasOwnProperty),
        u = n.forEach,
        c = n.map,
        l = (n.reduce, n.reduceRight, n.filter),
        d = (n.every, n.some),
        f = n.indexOf,
        h = (n.lastIndexOf, Array.isArray, Object.keys),
        p =
          (o.bind,
          (t.each = t.forEach =
            function (n, i, r) {
              if (null == n) return n;
              if (u && n.forEach === u) n.forEach(i, r);
              else if (n.length === +n.length) {
                for (var o = 0, a = n.length; o < a; o++)
                  if (i.call(r, n[o], o, n) === e) return;
              } else {
                var s = t.keys(n);
                for (o = 0, a = s.length; o < a; o++)
                  if (i.call(r, n[s[o]], s[o], n) === e) return;
              }
              return n;
            }));
      (t.map = t.collect =
        function (t, e, n) {
          var i = [];
          return null == t
            ? i
            : c && t.map === c
            ? t.map(e, n)
            : (p(t, function (t, r, o) {
                i.push(e.call(n, t, r, o));
              }),
              i);
        }),
        (t.find = t.detect =
          function (t, e, n) {
            var i;
            return (
              v(t, function (t, r, o) {
                if (e.call(n, t, r, o)) return (i = t), !0;
              }),
              i
            );
          }),
        (t.filter = t.select =
          function (t, e, n) {
            var i = [];
            return null == t
              ? i
              : l && t.filter === l
              ? t.filter(e, n)
              : (p(t, function (t, r, o) {
                  e.call(n, t, r, o) && i.push(t);
                }),
                i);
          });
      var v =
        (t.some =
        t.any =
          function (n, i, r) {
            i || (i = t.identity);
            var o = !1;
            return null == n
              ? o
              : d && n.some === d
              ? n.some(i, r)
              : (p(n, function (t, n, a) {
                  if (o || (o = i.call(r, t, n, a))) return e;
                }),
                !!o);
          });
      (t.contains = t.include =
        function (t, e) {
          return (
            null != t &&
            (f && t.indexOf === f
              ? -1 != t.indexOf(e)
              : v(t, function (t) {
                  return t === e;
                }))
          );
        }),
        (t.delay = function (t, e) {
          var n = a.call(arguments, 2);
          return setTimeout(function () {
            return t.apply(null, n);
          }, e);
        }),
        (t.defer = function (e) {
          return t.delay.apply(t, [e, 1].concat(a.call(arguments, 1)));
        }),
        (t.throttle = function (t) {
          var e, n, i;
          return function () {
            e ||
              ((e = !0),
              (n = arguments),
              (i = this),
              r.frame(function () {
                (e = !1), t.apply(i, n);
              }));
          };
        }),
        (t.debounce = function (e, n, i) {
          var r,
            o,
            a,
            s,
            u,
            c = function c() {
              var l = t.now() - s;
              l < n
                ? (r = setTimeout(c, n - l))
                : ((r = null), i || ((u = e.apply(a, o)), (a = o = null)));
            };
          return function () {
            (a = this), (o = arguments), (s = t.now());
            var l = i && !r;
            return (
              r || (r = setTimeout(c, n)),
              l && ((u = e.apply(a, o)), (a = o = null)),
              u
            );
          };
        }),
        (t.defaults = function (e) {
          if (!t.isObject(e)) return e;
          for (var n = 1, i = arguments.length; n < i; n++) {
            var r = arguments[n];
            for (var o in r) void 0 === e[o] && (e[o] = r[o]);
          }
          return e;
        }),
        (t.keys = function (e) {
          if (!t.isObject(e)) return [];
          if (h) return h(e);
          var n = [];
          for (var i in e) t.has(e, i) && n.push(i);
          return n;
        }),
        (t.has = function (t, e) {
          return s.call(t, e);
        }),
        (t.isObject = function (t) {
          return t === Object(t);
        }),
        (t.now =
          Date.now ||
          function () {
            return new Date().getTime();
          }),
        (t.templateSettings = {
          evaluate: /<%([\s\S]+?)%>/g,
          interpolate: /<%=([\s\S]+?)%>/g,
          escape: /<%-([\s\S]+?)%>/g,
        });
      var m = /(.)^/,
        g = {
          "'": "'",
          "\\": "\\",
          "\r": "r",
          "\n": "n",
          "\u2028": "u2028",
          "\u2029": "u2029",
        },
        w = /\\|'|\r|\n|\u2028|\u2029/g,
        y = function (t) {
          return "\\" + g[t];
        };
      return (
        (t.template = function (e, n, i) {
          !n && i && (n = i), (n = t.defaults({}, n, t.templateSettings));
          var r = RegExp(
              [
                (n.escape || m).source,
                (n.interpolate || m).source,
                (n.evaluate || m).source,
              ].join("|") + "|$",
              "g"
            ),
            o = 0,
            a = "__p+='";
          e.replace(r, function (t, n, i, r, s) {
            return (
              (a += e.slice(o, s).replace(w, y)),
              (o = s + t.length),
              n
                ? (a += "'+\n((__t=(" + n + "))==null?'':_.escape(__t))+\n'")
                : i
                ? (a += "'+\n((__t=(" + i + "))==null?'':__t)+\n'")
                : r && (a += "';\n" + r + "\n__p+='"),
              t
            );
          }),
            (a += "';\n"),
            n.variable || (a = "with(obj||{}){\n" + a + "}\n"),
            (a =
              "var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n" +
              a +
              "return __p;\n");
          try {
            var s = new Function(n.variable || "obj", "_", a);
          } catch (t) {
            throw ((t.source = a), t);
          }
          var u = function (e) {
              return s.call(this, e, t);
            },
            c = n.variable || "obj";
          return (u.source = "function(" + c + "){\n" + a + "}"), u;
        }),
        t
      );
    })();
  },
  function (t, e, n) {
    "use strict";
    var i = n(0);
    i.define(
      "edit",
      (t.exports = function (t, e, n) {
        if (
          ((n = n || {}),
          (i.env("test") || i.env("frame")) &&
            !n.fixture &&
            !(function () {
              try {
                return window.top.__Cypress__;
              } catch (t) {
                return !1;
              }
            })())
        )
          return { exit: 1 };
        var r,
          o = t(window),
          a = t(document.documentElement),
          s = document.location,
          u = "hashchange",
          c =
            n.load ||
            function () {
              (r = !0),
                (window.WebflowEditor = !0),
                o.off(u, d),
                (function (t) {
                  var e = window.document.createElement("iframe");
                  (e.src =
                    "https://webflow.com/site/third-party-cookie-check.html"),
                    (e.style.display = "none"),
                    (e.sandbox = "allow-scripts allow-same-origin");
                  var n = function n(i) {
                    "WF_third_party_cookies_unsupported" === i.data
                      ? (g(e, n), t(!1))
                      : "WF_third_party_cookies_supported" === i.data &&
                        (g(e, n), t(!0));
                  };
                  (e.onerror = function () {
                    g(e, n), t(!1);
                  }),
                    window.addEventListener("message", n, !1),
                    window.document.body.appendChild(e);
                })(function (e) {
                  t.ajax({
                    url: m("https://editor-api.webflow.com/api/editor/view"),
                    data: { siteId: a.attr("data-wf-site") },
                    xhrFields: { withCredentials: !0 },
                    dataType: "json",
                    crossDomain: !0,
                    success: f(e),
                  });
                });
            },
          l = !1;
        try {
          l =
            localStorage &&
            localStorage.getItem &&
            localStorage.getItem("WebflowEditor");
        } catch (t) {}
        function d() {
          r || (/\?edit/.test(s.hash) && c());
        }
        function f(t) {
          return function (e) {
            e
              ? ((e.thirdPartyCookiesSupported = t),
                h(v(e.bugReporterScriptPath), function () {
                  h(v(e.scriptPath), function () {
                    window.WebflowEditor(e);
                  });
                }))
              : console.error("Could not load editor data");
          };
        }
        function h(e, n) {
          t.ajax({ type: "GET", url: e, dataType: "script", cache: !0 }).then(
            n,
            p
          );
        }
        function p(t, e, n) {
          throw (console.error("Could not load editor script: " + e), n);
        }
        function v(t) {
          return t.indexOf("//") >= 0
            ? t
            : m("https://editor-api.webflow.com" + t);
        }
        function m(t) {
          return t.replace(/([^:])\/\//g, "$1/");
        }
        function g(t, e) {
          window.removeEventListener("message", e, !1), t.remove();
        }
        return (
          l
            ? c()
            : s.search
            ? (/[?&](edit)(?:[=&?]|$)/.test(s.search) ||
                /\?edit$/.test(s.href)) &&
              c()
            : o.on(u, d).triggerHandler(u),
          {}
        );
      })
    );
  },
  function (t, e, n) {
    "use strict";
    var i = n(0),
      r = n(3);
    i.define(
      "ix",
      (t.exports = function (t, e) {
        var n,
          o,
          a = {},
          s = t(window),
          u = ".w-ix",
          c = t.tram,
          l = i.env,
          d = l(),
          f = l.chrome && l.chrome < 35,
          h = "none 0s ease 0s",
          p = t(),
          v = {},
          m = [],
          g = [],
          w = [],
          y = 1,
          b = {
            tabs: ".w-tab-link, .w-tab-pane",
            dropdown: ".w-dropdown",
            slider: ".w-slide",
            navbar: ".w-nav",
          };
        function x(t) {
          t &&
            ((v = {}),
            e.each(t, function (t) {
              v[t.slug] = t.value;
            }),
            k());
        }
        function k() {
          !(function () {
            var e = t("[data-ix]");
            if (!e.length) return;
            e.each(E),
              e.each(_),
              m.length && (i.scroll.on(A), setTimeout(A, 1));
            g.length && i.load(T);
            w.length && setTimeout(C, y);
          })(),
            r.init(),
            i.redraw.up();
        }
        function _(n, o) {
          var s = t(o),
            c = s.attr("data-ix"),
            l = v[c];
          if (l) {
            var f = l.triggers;
            f &&
              (a.style(s, l.style),
              e.each(f, function (t) {
                var e = {},
                  n = t.type,
                  o = t.stepsB && t.stepsB.length;
                function a() {
                  I(t, s, { group: "A" });
                }
                function c() {
                  I(t, s, { group: "B" });
                }
                if ("load" !== n) {
                  if ("click" === n)
                    return (
                      s.on("click" + u, function (n) {
                        i.validClick(n.currentTarget) &&
                          ("#" === s.attr("href") && n.preventDefault(),
                          I(t, s, { group: e.clicked ? "B" : "A" }),
                          o && (e.clicked = !e.clicked));
                      }),
                      void (p = p.add(s))
                    );
                  if ("hover" === n)
                    return (
                      s.on("mouseenter" + u, a),
                      s.on("mouseleave" + u, c),
                      void (p = p.add(s))
                    );
                  if ("scroll" !== n) {
                    var l = b[n];
                    if (l) {
                      var f = s.closest(l);
                      return (
                        f.on(r.types.INTRO, a).on(r.types.OUTRO, c),
                        void (p = p.add(f))
                      );
                    }
                  } else
                    m.push({
                      el: s,
                      trigger: t,
                      state: { active: !1 },
                      offsetTop: O(t.offsetTop),
                      offsetBot: O(t.offsetBot),
                    });
                } else t.preload && !d ? g.push(a) : w.push(a);
              }));
          }
        }
        function O(t) {
          if (!t) return 0;
          t = String(t);
          var e = parseInt(t, 10);
          return e != e
            ? 0
            : (t.indexOf("%") > 0 && (e /= 100) >= 1 && (e = 0.999), e);
        }
        function E(e, n) {
          t(n).off(u);
        }
        function A() {
          for (
            var t = s.scrollTop(), e = s.height(), n = m.length, i = 0;
            i < n;
            i++
          ) {
            var r = m[i],
              o = r.el,
              a = r.trigger,
              u = a.stepsB && a.stepsB.length,
              c = r.state,
              l = o.offset().top,
              d = o.outerHeight(),
              f = r.offsetTop,
              h = r.offsetBot;
            f < 1 && f > 0 && (f *= e), h < 1 && h > 0 && (h *= e);
            var p = l + d - f >= t && l + h <= t + e;
            p !== c.active &&
              (!1 !== p || u) &&
              ((c.active = p), I(a, o, { group: p ? "A" : "B" }));
          }
        }
        function T() {
          for (var t = g.length, e = 0; e < t; e++) g[e]();
        }
        function C() {
          for (var t = w.length, e = 0; e < t; e++) w[e]();
        }
        function I(e, i, r, o) {
          var a = (r = r || {}).done,
            s = e.preserve3d;
          if (!n || r.force) {
            var u = r.group || "A",
              l = e["loop" + u],
              h = e["steps" + u];
            if (h && h.length) {
              if ((h.length < 2 && (l = !1), !o)) {
                var p = e.selector;
                p &&
                  ((i = e.descend
                    ? i.find(p)
                    : e.siblings
                    ? i.siblings(p)
                    : t(p)),
                  d && i.attr("data-ix-affect", 1)),
                  f && i.addClass("w-ix-emptyfix"),
                  s && i.css("transform-style", "preserve-3d");
              }
              for (var v = c(i), m = { omit3d: !s }, g = 0; g < h.length; g++)
                R(v, h[g], m);
              m.start ? v.then(w) : w();
            }
          }
          function w() {
            if (l) return I(e, i, r, !0);
            "auto" === m.width && v.set({ width: "auto" }),
              "auto" === m.height && v.set({ height: "auto" }),
              a && a();
          }
        }
        function R(t, e, n) {
          var r = "add",
            o = "start";
          n.start && (r = o = "then");
          var a = e.transition;
          if (a) {
            a = a.split(",");
            for (var s = 0; s < a.length; s++) {
              var u = a[s];
              t[r](u);
            }
          }
          var c = S(e, n) || {};
          if (
            (null != c.width && (n.width = c.width),
            null != c.height && (n.height = c.height),
            null == a)
          ) {
            n.start
              ? t.then(function () {
                  var e = this.queue;
                  this.set(c),
                    c.display && (t.redraw(), i.redraw.up()),
                    (this.queue = e),
                    this.next();
                })
              : (t.set(c), c.display && (t.redraw(), i.redraw.up()));
            var l = c.wait;
            null != l && (t.wait(l), (n.start = !0));
          } else {
            if (c.display) {
              var d = c.display;
              delete c.display,
                n.start
                  ? t.then(function () {
                      var t = this.queue;
                      this.set({ display: d }).redraw(),
                        i.redraw.up(),
                        (this.queue = t),
                        this.next();
                    })
                  : (t.set({ display: d }).redraw(), i.redraw.up());
            }
            t[o](c), (n.start = !0);
          }
        }
        function S(t, e) {
          var n = e && e.omit3d,
            i = {},
            r = !1;
          for (var o in t)
            "transition" !== o &&
              "keysort" !== o &&
              (!n ||
                ("z" !== o &&
                  "rotateX" !== o &&
                  "rotateY" !== o &&
                  "scaleZ" !== o)) &&
              ((i[o] = t[o]), (r = !0));
          return r ? i : null;
        }
        return (
          (a.init = function (t) {
            setTimeout(function () {
              x(t);
            }, 1);
          }),
          (a.preview = function () {
            (n = !1),
              (y = 100),
              setTimeout(function () {
                x(window.__wf_ix);
              }, 1);
          }),
          (a.design = function () {
            (n = !0), a.destroy();
          }),
          (a.destroy = function () {
            (o = !0),
              p.each(E),
              i.scroll.off(A),
              r.async(),
              (m = []),
              (g = []),
              (w = []);
          }),
          (a.ready = function () {
            if (d) return l("design") ? a.design() : a.preview();
            v && o && ((o = !1), k());
          }),
          (a.run = I),
          (a.style = d
            ? function (e, n) {
                var i = c(e);
                if (t.isEmptyObject(n)) return;
                e.css("transition", "");
                var r = e.css("transition");
                r === h && (r = i.upstream = null);
                (i.upstream = h), i.set(S(n)), (i.upstream = r);
              }
            : function (t, e) {
                c(t).set(S(e));
              }),
          a
        );
      })
    );
  },
  function (t, e, n) {
    "use strict";
    var i = n(0);
    i.define(
      "links",
      (t.exports = function (t, e) {
        var n,
          r,
          o,
          a = {},
          s = t(window),
          u = i.env(),
          c = window.location,
          l = document.createElement("a"),
          d = "w--current",
          f = /index\.(html|php)$/,
          h = /\/$/;
        function p(e) {
          var i =
            (n && e.getAttribute("href-disabled")) || e.getAttribute("href");
          if (((l.href = i), !(i.indexOf(":") >= 0))) {
            var a = t(e);
            if (
              l.hash.length > 1 &&
              l.host + l.pathname === c.host + c.pathname
            ) {
              if (!/^#[a-zA-Z0-9\-\_]+$/.test(l.hash)) return;
              var s = t(l.hash);
              s.length && r.push({ link: a, sec: s, active: !1 });
            } else if ("#" !== i && "" !== i) {
              var u = l.href === c.href || i === o || (f.test(i) && h.test(o));
              m(a, d, u);
            }
          }
        }
        function v() {
          var t = s.scrollTop(),
            n = s.height();
          e.each(r, function (e) {
            var i = e.link,
              r = e.sec,
              o = r.offset().top,
              a = r.outerHeight(),
              s = 0.5 * n,
              u = r.is(":visible") && o + a - s >= t && o + s <= t + n;
            e.active !== u && ((e.active = u), m(i, d, u));
          });
        }
        function m(t, e, n) {
          var i = t.hasClass(e);
          (n && i) || ((n || i) && (n ? t.addClass(e) : t.removeClass(e)));
        }
        return (
          (a.ready =
            a.design =
            a.preview =
              function () {
                (n = u && i.env("design")),
                  (o = i.env("slug") || c.pathname || ""),
                  i.scroll.off(v),
                  (r = []);
                for (var t = document.links, e = 0; e < t.length; ++e) p(t[e]);
                r.length && (i.scroll.on(v), v());
              }),
          a
        );
      })
    );
  },
  function (t, e, n) {
    "use strict";
    var i = n(0);
    i.define(
      "scroll",
      (t.exports = function (t) {
        var e,
          n = {
            CLICK_EMPTY: "click.wf-empty-link",
            CLICK_SCROLL: "click.wf-scroll",
          },
          r = t(document),
          o = window,
          a = o.location,
          s = (function () {
            try {
              return Boolean(o.frameElement);
            } catch (t) {
              return !0;
            }
          })()
            ? null
            : o.history,
          u = /^[a-zA-Z0-9][\w:.-]*$/,
          c = 'a[href="#"]',
          l = 'a[href*="#"]:not(.w-tab-link):not(' + c + ")";
        function d(n) {
          if (
            !(
              i.env("design") ||
              (window.$.mobile && t(n.currentTarget).hasClass("ui-link"))
            )
          ) {
            var r = this.href.split("#"),
              c = r[0] === e ? r[1] : null;
            c &&
              (function (e, n) {
                if (!u.test(e)) return;
                var r = t("#" + e);
                if (!r.length) return;
                n && (n.preventDefault(), n.stopPropagation());
                if (
                  a.hash !== e &&
                  s &&
                  s.pushState &&
                  (!i.env.chrome || "file:" !== a.protocol)
                ) {
                  var c = s.state && s.state.hash;
                  c !== e && s.pushState({ hash: e }, "", "#" + e);
                }
                var l = i.env("editor") ? ".w-editor-body" : "body",
                  d = t(
                    "header, " +
                      l +
                      " > .header, " +
                      l +
                      " > .w-nav:not([data-no-scroll])"
                  ),
                  f = "fixed" === d.css("position") ? d.outerHeight() : 0;
                o.setTimeout(
                  function () {
                    !(function (e, n) {
                      var i = t(o).scrollTop(),
                        r = e.offset().top - n;
                      if ("mid" === e.data("scroll")) {
                        var a = t(o).height() - n,
                          s = e.outerHeight();
                        s < a && (r -= Math.round((a - s) / 2));
                      }
                      var u = 1;
                      t("body")
                        .add(e)
                        .each(function () {
                          var e = parseFloat(
                            t(this).attr("data-scroll-time"),
                            10
                          );
                          !isNaN(e) && (0 === e || e > 0) && (u = e);
                        }),
                        Date.now ||
                          (Date.now = function () {
                            return new Date().getTime();
                          });
                      var c = Date.now(),
                        l =
                          o.requestAnimationFrame ||
                          o.mozRequestAnimationFrame ||
                          o.webkitRequestAnimationFrame ||
                          function (t) {
                            o.setTimeout(t, 15);
                          },
                        d =
                          (472.143 * Math.log(Math.abs(i - r) + 125) - 2e3) * u;
                      !(function t() {
                        var e = Date.now() - c;
                        o.scroll(
                          0,
                          (function (t, e, n, i) {
                            if (n > i) return e;
                            return (
                              t +
                              (e - t) *
                                ((r = n / i),
                                r < 0.5
                                  ? 4 * r * r * r
                                  : (r - 1) * (2 * r - 2) * (2 * r - 2) + 1)
                            );
                            var r;
                          })(i, r, e, d)
                        ),
                          e <= d && l(t);
                      })();
                    })(r, f);
                  },
                  n ? 0 : 300
                );
              })(c, n);
          }
        }
        return {
          ready: function () {
            var t = n.CLICK_EMPTY,
              i = n.CLICK_SCROLL;
            (e = a.href.split("#")[0]),
              r.on(i, l, d),
              r.on(t, c, function (t) {
                t.preventDefault();
              });
          },
        };
      })
    );
  },
  function (t, e, n) {
    "use strict";
    n(0).define(
      "touch",
      (t.exports = function (t) {
        var e = {},
          n = window.getSelection;
        function i(e) {
          var i,
            r,
            o = !1,
            a = !1,
            s = Math.min(Math.round(0.04 * window.innerWidth), 40);
          function u(t) {
            var e = t.touches;
            (e && e.length > 1) ||
              ((o = !0),
              e ? ((a = !0), (i = e[0].clientX)) : (i = t.clientX),
              (r = i));
          }
          function c(e) {
            if (o) {
              if (a && "mousemove" === e.type)
                return e.preventDefault(), void e.stopPropagation();
              var i = e.touches,
                u = i ? i[0].clientX : e.clientX,
                c = u - r;
              (r = u),
                Math.abs(c) > s &&
                  n &&
                  "" === String(n()) &&
                  (!(function (e, n, i) {
                    var r = t.Event(e, { originalEvent: n });
                    t(n.target).trigger(r, i);
                  })("swipe", e, { direction: c > 0 ? "right" : "left" }),
                  d());
            }
          }
          function l(t) {
            if (o)
              return (
                (o = !1),
                a && "mouseup" === t.type
                  ? (t.preventDefault(), t.stopPropagation(), void (a = !1))
                  : void 0
              );
          }
          function d() {
            o = !1;
          }
          e.addEventListener("touchstart", u, !1),
            e.addEventListener("touchmove", c, !1),
            e.addEventListener("touchend", l, !1),
            e.addEventListener("touchcancel", d, !1),
            e.addEventListener("mousedown", u, !1),
            e.addEventListener("mousemove", c, !1),
            e.addEventListener("mouseup", l, !1),
            e.addEventListener("mouseout", d, !1),
            (this.destroy = function () {
              e.removeEventListener("touchstart", u, !1),
                e.removeEventListener("touchmove", c, !1),
                e.removeEventListener("touchend", l, !1),
                e.removeEventListener("touchcancel", d, !1),
                e.removeEventListener("mousedown", u, !1),
                e.removeEventListener("mousemove", c, !1),
                e.removeEventListener("mouseup", l, !1),
                e.removeEventListener("mouseout", d, !1),
                (e = null);
            });
        }
        return (
          (t.event.special.tap = { bindType: "click", delegateType: "click" }),
          (e.init = function (e) {
            return (e = "string" == typeof e ? t(e).get(0) : e)
              ? new i(e)
              : null;
          }),
          (e.instance = e.init(document)),
          e
        );
      })
    );
  },
  function (t, e, n) {
    "use strict";
    var i = n(0),
      r = n(1),
      o = {
        ARROW_LEFT: 37,
        ARROW_UP: 38,
        ARROW_RIGHT: 39,
        ARROW_DOWN: 40,
        ESCAPE: 27,
        SPACE: 32,
        ENTER: 13,
        HOME: 36,
        END: 35,
      },
      a = !0;
    i.define(
      "dropdown",
      (t.exports = function (t, e) {
        var n,
          s,
          u = e.debounce,
          c = {},
          l = i.env(),
          d = !1,
          f = i.env.touch,
          h = ".w-dropdown",
          p = "w--open",
          v = r.triggers,
          m = 900,
          g = "focusout" + h,
          w = "keydown" + h,
          y = "mouseenter" + h,
          b = "mousemove" + h,
          x = "mouseleave" + h,
          k = (f ? "click" : "mouseup") + h,
          _ = "w-close" + h,
          O = "setting" + h,
          E = t(document);
        function A() {
          (n = l && i.env("design")), (s = E.find(h)).each(T);
        }
        function T(e, r) {
          var s = t(r),
            c = t.data(r, h);
          c ||
            (c = t.data(r, h, {
              open: !1,
              el: s,
              config: {},
              selectedIdx: -1,
            })),
            (c.toggle = c.el.children(".w-dropdown-toggle")),
            (c.list = c.el.children(".w-dropdown-list")),
            (c.links = c.list.find("a:not(.w-dropdown .w-dropdown a)")),
            (c.complete = (function (t) {
              return function () {
                t.list.removeClass(p),
                  t.toggle.removeClass(p),
                  t.manageZ && t.el.css("z-index", "");
              };
            })(c)),
            (c.mouseLeave = (function (t) {
              return function () {
                (t.hovering = !1), t.links.is(":focus") || S(t);
              };
            })(c)),
            (c.mouseUpOutside = (function (e) {
              e.mouseUpOutside && E.off(k, e.mouseUpOutside);
              return u(function (n) {
                if (e.open) {
                  var r = t(n.target);
                  if (!r.closest(".w-dropdown-toggle").length) {
                    var o = -1 === t.inArray(e.el[0], r.parents(h)),
                      a = i.env("editor");
                    if (o) {
                      if (a) {
                        var s =
                            1 === r.parents().length &&
                            1 === r.parents("svg").length,
                          u = r.parents(
                            ".w-editor-bem-EditorHoverControls"
                          ).length;
                        if (s || u) return;
                      }
                      S(e);
                    }
                  }
                }
              });
            })(c)),
            (c.mouseMoveOutside = (function (e) {
              return u(function (n) {
                if (e.open) {
                  var i = t(n.target),
                    r = -1 === t.inArray(e.el[0], i.parents(h));
                  if (r) {
                    var o = i.parents(
                        ".w-editor-bem-EditorHoverControls"
                      ).length,
                      a = i.parents(".w-editor-bem-RTToolbar").length,
                      s = t(".w-editor-bem-EditorOverlay"),
                      u =
                        s.find(".w-editor-edit-outline").length ||
                        s.find(".w-editor-bem-RTToolbar").length;
                    if (o || a || u) return;
                    (e.hovering = !1), S(e);
                  }
                }
              });
            })(c)),
            C(c);
          var f = c.toggle.attr("id"),
            v = c.list.attr("id");
          f || (f = "w-dropdown-toggle-" + e),
            v || (v = "w-dropdown-list-" + e),
            c.toggle.attr("id", f),
            c.toggle.attr("aria-controls", v),
            c.toggle.attr("aria-haspopup", "menu"),
            c.toggle.attr("aria-expanded", "false"),
            "BUTTON" !== c.toggle.prop("tagName") &&
              (c.toggle.attr("role", "button"),
              c.toggle.attr("tabindex") || c.toggle.attr("tabindex", "0")),
            c.list.attr("id", v),
            c.list.attr("aria-labelledby", f),
            c.links.each(function (t, e) {
              e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0");
            }),
            c.toggle.css("outline", "none"),
            c.links.css("outline", "none"),
            c.el.off(h),
            c.toggle.off(h),
            c.nav && c.nav.off(h);
          var m = I(c, a);
          n &&
            c.el.on(
              O,
              (function (t) {
                return function (e, n) {
                  (n = n || {}),
                    C(t),
                    !0 === n.open && R(t),
                    !1 === n.open && S(t, { immediate: !0 });
                };
              })(c)
            ),
            n ||
              (l && ((c.hovering = !1), S(c)),
              c.config.hover &&
                c.toggle.on(
                  y,
                  (function (t) {
                    return function () {
                      (t.hovering = !0), R(t);
                    };
                  })(c)
                ),
              c.el.on(_, m),
              c.el.on(
                w,
                (function (t) {
                  return function (e) {
                    if (!n && !d && t.open)
                      switch (
                        ((t.selectedIdx = t.links.index(
                          document.activeElement
                        )),
                        e.keyCode)
                      ) {
                        case o.HOME:
                          if (!t.open) return;
                          return (t.selectedIdx = 0), L(t), e.preventDefault();
                        case o.END:
                          if (!t.open) return;
                          return (
                            (t.selectedIdx = t.links.length - 1),
                            L(t),
                            e.preventDefault()
                          );
                        case o.ESCAPE:
                          return S(t), t.toggle.focus(), e.stopPropagation();
                        case o.ARROW_RIGHT:
                        case o.ARROW_DOWN:
                          return (
                            (t.selectedIdx = Math.min(
                              t.links.length - 1,
                              t.selectedIdx + 1
                            )),
                            L(t),
                            e.preventDefault()
                          );
                        case o.ARROW_LEFT:
                        case o.ARROW_UP:
                          return (
                            (t.selectedIdx = Math.max(-1, t.selectedIdx - 1)),
                            L(t),
                            e.preventDefault()
                          );
                      }
                  };
                })(c)
              ),
              c.el.on(
                g,
                (function (t) {
                  return u(function (e) {
                    var n = e.relatedTarget,
                      i = e.target,
                      r = t.el[0],
                      o = r.contains(n) || r.contains(i);
                    return o || S(t), e.stopPropagation();
                  });
                })(c)
              ),
              c.toggle.on(k, m),
              c.toggle.on(
                w,
                (function (t) {
                  var e = I(t, a);
                  return function (i) {
                    if (!n && !d) {
                      if (!t.open)
                        switch (i.keyCode) {
                          case o.ARROW_UP:
                          case o.ARROW_DOWN:
                            return i.stopPropagation();
                        }
                      switch (i.keyCode) {
                        case o.SPACE:
                        case o.ENTER:
                          return e(), i.stopPropagation(), i.preventDefault();
                      }
                    }
                  };
                })(c)
              ),
              (c.nav = c.el.closest(".w-nav")),
              c.nav.on(_, m));
        }
        function C(t) {
          var e = Number(t.el.css("z-index"));
          (t.manageZ = e === m || e === m + 1),
            (t.config = {
              hover:
                (!0 === t.el.attr("data-hover") ||
                  "1" === t.el.attr("data-hover")) &&
                !f,
              delay: Number(t.el.attr("data-delay")) || 0,
            });
        }
        function I(t, e) {
          return u(function (n) {
            if (t.open || (n && "w-close" === n.type))
              return S(t, { forceClose: e });
            R(t);
          });
        }
        function R(e) {
          if (!e.open) {
            !(function (e) {
              var n = e.el[0];
              s.each(function (e, i) {
                var r = t(i);
                r.is(n) || r.has(n).length || r.triggerHandler(_);
              });
            })(e),
              (e.open = !0),
              e.list.addClass(p),
              e.toggle.addClass(p),
              e.toggle.attr("aria-expanded", "true"),
              v.intro(0, e.el[0]),
              i.redraw.up(),
              e.manageZ && e.el.css("z-index", m + 1);
            var r = i.env("editor");
            n || E.on(k, e.mouseUpOutside),
              e.hovering && !r && e.el.on(x, e.mouseLeave),
              e.hovering && r && E.on(b, e.mouseMoveOutside),
              window.clearTimeout(e.delayId);
          }
        }
        function S(t) {
          var e =
              arguments.length > 1 && void 0 !== arguments[1]
                ? arguments[1]
                : {},
            n = e.immediate,
            i = e.forceClose;
          if (t.open && (!t.config.hover || !t.hovering || i)) {
            t.toggle.attr("aria-expanded", "false"), (t.open = !1);
            var r = t.config;
            if (
              (v.outro(0, t.el[0]),
              E.off(k, t.mouseUpOutside),
              E.off(b, t.mouseMoveOutside),
              t.el.off(x, t.mouseLeave),
              window.clearTimeout(t.delayId),
              !r.delay || n)
            )
              return t.complete();
            t.delayId = window.setTimeout(t.complete, r.delay);
          }
        }
        function L(t) {
          t.links[t.selectedIdx] && t.links[t.selectedIdx].focus();
        }
        return (
          (c.ready = A),
          (c.design = function () {
            d &&
              E.find(h).each(function (e, n) {
                t(n).triggerHandler(_);
              }),
              (d = !1),
              A();
          }),
          (c.preview = function () {
            (d = !0), A();
          }),
          c
        );
      })
    );
  },
  function (t, e, n) {
    "use strict";
    var i = n(2)(n(17)),
      r = n(0);
    r.define(
      "forms",
      (t.exports = function (t, e) {
        var n,
          o,
          a,
          s,
          u,
          c = {},
          l = t(document),
          d = window.location,
          f = window.XDomainRequest && !window.atob,
          h = ".w-form",
          p = /e(-)?mail/i,
          v = /^\S+@\S+$/,
          m = window.alert,
          g = r.env(),
          w = /list-manage[1-9]?.com/i,
          y = e.debounce(function () {
            m(
              "Oops! This page has improperly configured forms. Please contact your website administrator to fix this issue."
            );
          }, 100);
        function b(e, n) {
          var i = t(n),
            r = t.data(n, h);
          r || (r = t.data(n, h, { form: i })), x(r);
          var a = i.closest("div.w-form");
          (r.done = a.find("> .w-form-done")),
            (r.fail = a.find("> .w-form-fail")),
            (r.fileUploads = a.find(".w-file-upload")),
            r.fileUploads.each(function (e) {
              !(function (e, n) {
                if (!n.fileUploads || !n.fileUploads[e]) return;
                var i,
                  r = t(n.fileUploads[e]),
                  o = r.find("> .w-file-upload-default"),
                  a = r.find("> .w-file-upload-uploading"),
                  s = r.find("> .w-file-upload-success"),
                  c = r.find("> .w-file-upload-error"),
                  l = o.find(".w-file-upload-input"),
                  d = o.find(".w-file-upload-label"),
                  f = d.children(),
                  h = c.find(".w-file-upload-error-msg"),
                  p = s.find(".w-file-upload-file"),
                  v = s.find(".w-file-remove-link"),
                  m = p.find(".w-file-upload-file-name"),
                  w = h.attr("data-w-size-error"),
                  y = h.attr("data-w-type-error"),
                  b = h.attr("data-w-generic-error");
                if (g)
                  l.on("click", function (t) {
                    t.preventDefault();
                  }),
                    d.on("click", function (t) {
                      t.preventDefault();
                    }),
                    f.on("click", function (t) {
                      t.preventDefault();
                    });
                else {
                  v.on("click", function () {
                    l.removeAttr("data-value"),
                      l.val(""),
                      m.html(""),
                      o.toggle(!0),
                      s.toggle(!1);
                  }),
                    l.on("change", function (r) {
                      (i = r.target && r.target.files && r.target.files[0]) &&
                        (o.toggle(!1),
                        c.toggle(!1),
                        a.toggle(!0),
                        m.text(i.name),
                        T() || k(n),
                        (n.fileUploads[e].uploading = !0),
                        (function (e, n) {
                          var i = { name: e.name, size: e.size };
                          t.ajax({
                            type: "POST",
                            url: u,
                            data: i,
                            dataType: "json",
                            crossDomain: !0,
                          })
                            .done(function (t) {
                              n(null, t);
                            })
                            .fail(function (t) {
                              n(t);
                            });
                        })(i, E));
                    });
                  var _ = d.outerHeight();
                  l.height(_), l.width(1);
                }
                function O(t) {
                  var i = t.responseJSON && t.responseJSON.msg,
                    r = b;
                  "string" == typeof i &&
                  0 === i.indexOf("InvalidFileTypeError")
                    ? (r = y)
                    : "string" == typeof i &&
                      0 === i.indexOf("MaxFileSizeError") &&
                      (r = w),
                    h.text(r),
                    l.removeAttr("data-value"),
                    l.val(""),
                    a.toggle(!1),
                    o.toggle(!0),
                    c.toggle(!0),
                    (n.fileUploads[e].uploading = !1),
                    T() || x(n);
                }
                function E(e, n) {
                  if (e) return O(e);
                  var r = n.fileName,
                    o = n.postData,
                    a = n.fileId,
                    s = n.s3Url;
                  l.attr("data-value", a),
                    (function (e, n, i, r, o) {
                      var a = new FormData();
                      for (var s in n) a.append(s, n[s]);
                      a.append("file", i, r),
                        t
                          .ajax({
                            type: "POST",
                            url: e,
                            data: a,
                            processData: !1,
                            contentType: !1,
                          })
                          .done(function () {
                            o(null);
                          })
                          .fail(function (t) {
                            o(t);
                          });
                    })(s, o, i, r, A);
                }
                function A(t) {
                  if (t) return O(t);
                  a.toggle(!1),
                    s.css("display", "inline-block"),
                    (n.fileUploads[e].uploading = !1),
                    T() || x(n);
                }
                function T() {
                  var t = (n.fileUploads && n.fileUploads.toArray()) || [];
                  return t.some(function (t) {
                    return t.uploading;
                  });
                }
              })(e, r);
            });
          var s = (r.action = i.attr("action"));
          (r.handler = null),
            (r.redirect = i.attr("data-redirect")),
            w.test(s) ? (r.handler = E) : s || (o ? (r.handler = O) : y());
        }
        function x(t) {
          var e = (t.btn = t.form.find(':input[type="submit"]'));
          (t.wait = t.btn.attr("data-wait") || null),
            (t.success = !1),
            e.prop("disabled", !1),
            t.label && e.val(t.label);
        }
        function k(t) {
          var e = t.btn,
            n = t.wait;
          e.prop("disabled", !0), n && ((t.label = e.val()), e.val(n));
        }
        function _(e, n) {
          var i = null;
          return (
            (n = n || {}),
            e
              .find(':input:not([type="submit"]):not([type="file"])')
              .each(function (r, o) {
                var a = t(o),
                  s = a.attr("type"),
                  u =
                    a.attr("data-name") || a.attr("name") || "Field " + (r + 1),
                  c = a.val();
                if ("checkbox" === s) c = a.is(":checked");
                else if ("radio" === s) {
                  if (null === n[u] || "string" == typeof n[u]) return;
                  c =
                    e
                      .find('input[name="' + a.attr("name") + '"]:checked')
                      .val() || null;
                }
                "string" == typeof c && (c = t.trim(c)),
                  (n[u] = c),
                  (i =
                    i ||
                    (function (t, e, n, i) {
                      var r = null;
                      "password" === e
                        ? (r = "Passwords cannot be submitted.")
                        : t.attr("required")
                        ? i
                          ? p.test(t.attr("type")) &&
                            (v.test(i) ||
                              (r =
                                "Please enter a valid email address for: " + n))
                          : (r = "Please fill out the required field: " + n)
                        : "g-recaptcha-response" !== n ||
                          i ||
                          (r = "Please confirm youâ€™re not a robot.");
                      return r;
                    })(a, s, u, c));
              }),
            i
          );
        }
        function O(e) {
          x(e);
          var n = e.form,
            i = {
              name: n.attr("data-name") || n.attr("name") || "Untitled Form",
              source: d.href,
              test: r.env(),
              fields: {},
              fileUploads: {},
              dolphin: /pass[\s-_]?(word|code)|secret|login|credentials/i.test(
                n.html()
              ),
            };
          T(e);
          var a = _(n, i.fields);
          if (a) return m(a);
          (i.fileUploads = (function (e) {
            var n = {};
            return (
              e.find(':input[type="file"]').each(function (e, i) {
                var r = t(i),
                  o =
                    r.attr("data-name") || r.attr("name") || "File " + (e + 1),
                  a = r.attr("data-value");
                "string" == typeof a && (a = t.trim(a)), (n[o] = a);
              }),
              n
            );
          })(n)),
            k(e),
            o
              ? t
                  .ajax({
                    url: s,
                    type: "POST",
                    data: i,
                    dataType: "json",
                    crossDomain: !0,
                  })
                  .done(function (t) {
                    t && 200 === t.code && (e.success = !0), A(e);
                  })
                  .fail(function () {
                    A(e);
                  })
              : A(e);
        }
        function E(n) {
          x(n);
          var i = n.form,
            r = {};
          if (!/^https/.test(d.href) || /^https/.test(n.action)) {
            T(n);
            var o,
              a = _(i, r);
            if (a) return m(a);
            k(n),
              e.each(r, function (t, e) {
                p.test(e) && (r.EMAIL = t),
                  /^((full[ _-]?)?name)$/i.test(e) && (o = t),
                  /^(first[ _-]?name)$/i.test(e) && (r.FNAME = t),
                  /^(last[ _-]?name)$/i.test(e) && (r.LNAME = t);
              }),
              o &&
                !r.FNAME &&
                ((o = o.split(" ")),
                (r.FNAME = o[0]),
                (r.LNAME = r.LNAME || o[1]));
            var s = n.action.replace("/post?", "/post-json?") + "&c=?",
              u = s.indexOf("u=") + 2;
            u = s.substring(u, s.indexOf("&", u));
            var c = s.indexOf("id=") + 3;
            (c = s.substring(c, s.indexOf("&", c))),
              (r["b_" + u + "_" + c] = ""),
              t
                .ajax({ url: s, data: r, dataType: "jsonp" })
                .done(function (t) {
                  (n.success = "success" === t.result || /already/.test(t.msg)),
                    n.success || console.info("MailChimp error: " + t.msg),
                    A(n);
                })
                .fail(function () {
                  A(n);
                });
          } else i.attr("method", "post");
        }
        function A(t) {
          var e = t.form,
            n = t.redirect,
            i = t.success;
          i && n
            ? r.location(n)
            : (t.done.toggle(i), t.fail.toggle(!i), e.toggle(!i), x(t));
        }
        function T(t) {
          t.evt && t.evt.preventDefault(), (t.evt = null);
        }
        return (
          (c.ready =
            c.design =
            c.preview =
              function () {
                !(function () {
                  (o = t("html").attr("data-wf-site")),
                    (s = "https://webflow.com/api/v1/form/" + o),
                    f &&
                      s.indexOf("https://webflow.com") >= 0 &&
                      (s = s.replace(
                        "https://webflow.com",
                        "http://formdata.webflow.com"
                      ));
                  if (
                    ((u = "".concat(s, "/signFile")),
                    !(n = t(h + " form")).length)
                  )
                    return;
                  n.each(b);
                })(),
                  g ||
                    a ||
                    (function () {
                      (a = !0),
                        l.on("submit", h + " form", function (e) {
                          var n = t.data(this, h);
                          n.handler && ((n.evt = e), n.handler(n));
                        });
                      var e = [
                        ["checkbox", ".w-checkbox-input"],
                        ["radio", ".w-radio-input"],
                      ];
                      l.on(
                        "change",
                        h +
                          ' form input[type="checkbox"]:not(.w-checkbox-input)',
                        function (e) {
                          t(e.target)
                            .siblings(".w-checkbox-input")
                            .toggleClass("w--redirected-checked");
                        }
                      ),
                        l.on(
                          "change",
                          h + ' form input[type="radio"]',
                          function (e) {
                            t(
                              'input[name="'
                                .concat(e.target.name, '"]:not(')
                                .concat(".w-checkbox-input", ")")
                            ).map(function (e, n) {
                              return t(n)
                                .siblings(".w-radio-input")
                                .removeClass("w--redirected-checked");
                            });
                            var n = t(e.target);
                            n.hasClass("w-radio-input") ||
                              n
                                .siblings(".w-radio-input")
                                .addClass("w--redirected-checked");
                          }
                        ),
                        e.forEach(function (e) {
                          var n = (0, i.default)(e, 2),
                            r = n[0],
                            o = n[1];
                          l.on(
                            "focus",
                            h +
                              ' form input[type="'.concat(r, '"]:not(') +
                              o +
                              ")",
                            function (e) {
                              t(e.target)
                                .siblings(o)
                                .addClass("w--redirected-focus");
                            }
                          ),
                            l.on(
                              "blur",
                              h +
                                ' form input[type="'.concat(r, '"]:not(') +
                                o +
                                ")",
                              function (e) {
                                t(e.target)
                                  .siblings(o)
                                  .removeClass("w--redirected-focus");
                              }
                            );
                        });
                    })();
              }),
          c
        );
      })
    );
  },
  function (t, e, n) {
    var i = n(18),
      r = n(19),
      o = n(20);
    t.exports = function (t, e) {
      return i(t) || r(t, e) || o();
    };
  },
  function (t, e) {
    t.exports = function (t) {
      if (Array.isArray(t)) return t;
    };
  },
  function (t, e) {
    t.exports = function (t, e) {
      var n = [],
        i = !0,
        r = !1,
        o = void 0;
      try {
        for (
          var a, s = t[Symbol.iterator]();
          !(i = (a = s.next()).done) && (n.push(a.value), !e || n.length !== e);
          i = !0
        );
      } catch (t) {
        (r = !0), (o = t);
      } finally {
        try {
          i || null == s.return || s.return();
        } finally {
          if (r) throw o;
        }
      }
      return n;
    };
  },
  function (t, e) {
    t.exports = function () {
      throw new TypeError(
        "Invalid attempt to destructure non-iterable instance"
      );
    };
  },
  function (t, e, n) {
    "use strict";
    var i = n(0),
      r = n(1),
      o = {
        ARROW_LEFT: 37,
        ARROW_UP: 38,
        ARROW_RIGHT: 39,
        ARROW_DOWN: 40,
        ESCAPE: 27,
        SPACE: 32,
        ENTER: 13,
        HOME: 36,
        END: 35,
      };
    i.define(
      "navbar",
      (t.exports = function (t, e) {
        var n,
          a,
          s,
          u,
          c = {},
          l = t.tram,
          d = t(window),
          f = t(document),
          h = e.debounce,
          p = i.env(),
          v = '<div class="w-nav-overlay" data-wf-ignore />',
          m = ".w-nav",
          g = "w--open",
          w = "w--nav-dropdown-open",
          y = "w--nav-dropdown-toggle-open",
          b = "w--nav-dropdown-list-open",
          x = "w--nav-link-open",
          k = r.triggers,
          _ = t();
        function O() {
          i.resize.off(E);
        }
        function E() {
          a.each(P);
        }
        function A(n, i) {
          var r = t(i),
            a = t.data(i, m);
          a ||
            (a = t.data(i, m, {
              open: !1,
              el: r,
              config: {},
              selectedIdx: -1,
            })),
            (a.menu = r.find(".w-nav-menu")),
            (a.links = a.menu.find(".w-nav-link")),
            (a.dropdowns = a.menu.find(".w-dropdown")),
            (a.dropdownToggle = a.menu.find(".w-dropdown-toggle")),
            (a.dropdownList = a.menu.find(".w-dropdown-list")),
            (a.button = r.find(".w-nav-button")),
            (a.container = r.find(".w-container")),
            (a.overlayContainerId = "w-nav-overlay-" + n),
            (a.outside = (function (e) {
              e.outside && f.off("click" + m, e.outside);
              return function (n) {
                var i = t(n.target);
                (u && i.closest(".w-editor-bem-EditorOverlay").length) ||
                  M(e, i);
              };
            })(a));
          var c = r.find(".w-nav-brand");
          c &&
            "/" === c.attr("href") &&
            null == c.attr("aria-label") &&
            c.attr("aria-label", "home"),
            a.button.attr("style", "-webkit-user-select: text;"),
            null == a.button.attr("aria-label") &&
              a.button.attr("aria-label", "menu"),
            a.button.attr("role", "button"),
            a.button.attr("tabindex", "0"),
            a.button.attr("aria-controls", a.overlayContainerId),
            a.button.attr("aria-haspopup", "menu"),
            a.button.attr("aria-expanded", "false"),
            a.el.off(m),
            a.button.off(m),
            a.menu.off(m),
            I(a),
            s
              ? (C(a),
                a.el.on(
                  "setting" + m,
                  (function (t) {
                    return function (n, i) {
                      i = i || {};
                      var r = d.width();
                      I(t),
                        !0 === i.open && W(t, !0),
                        !1 === i.open && q(t, !0),
                        t.open &&
                          e.defer(function () {
                            r !== d.width() && S(t);
                          });
                    };
                  })(a)
                ))
              : (!(function (e) {
                  if (e.overlay) return;
                  (e.overlay = t(v).appendTo(e.el)),
                    e.overlay.attr("id", e.overlayContainerId),
                    (e.parent = e.menu.parent()),
                    q(e, !0);
                })(a),
                a.button.on("click" + m, L(a)),
                a.menu.on("click" + m, "a", z(a)),
                a.button.on(
                  "keydown" + m,
                  (function (t) {
                    return function (e) {
                      switch (e.keyCode) {
                        case o.SPACE:
                        case o.ENTER:
                          return (
                            L(t)(), e.preventDefault(), e.stopPropagation()
                          );
                        case o.ESCAPE:
                          return q(t), e.preventDefault(), e.stopPropagation();
                        case o.ARROW_RIGHT:
                        case o.ARROW_DOWN:
                        case o.HOME:
                        case o.END:
                          return t.open
                            ? (e.keyCode === o.END
                                ? (t.selectedIdx = t.links.length - 1)
                                : (t.selectedIdx = 0),
                              R(t),
                              e.preventDefault(),
                              e.stopPropagation())
                            : (e.preventDefault(), e.stopPropagation());
                      }
                    };
                  })(a)
                ),
                a.el.on(
                  "keydown" + m,
                  (function (t) {
                    return function (e) {
                      if (t.open)
                        switch (
                          ((t.selectedIdx = t.links.index(
                            document.activeElement
                          )),
                          e.keyCode)
                        ) {
                          case o.HOME:
                          case o.END:
                            return (
                              e.keyCode === o.END
                                ? (t.selectedIdx = t.links.length - 1)
                                : (t.selectedIdx = 0),
                              R(t),
                              e.preventDefault(),
                              e.stopPropagation()
                            );
                          case o.ESCAPE:
                            return (
                              q(t),
                              t.button.focus(),
                              e.preventDefault(),
                              e.stopPropagation()
                            );
                          case o.ARROW_LEFT:
                          case o.ARROW_UP:
                            return (
                              (t.selectedIdx = Math.max(-1, t.selectedIdx - 1)),
                              R(t),
                              e.preventDefault(),
                              e.stopPropagation()
                            );
                          case o.ARROW_RIGHT:
                          case o.ARROW_DOWN:
                            return (
                              (t.selectedIdx = Math.min(
                                t.links.length - 1,
                                t.selectedIdx + 1
                              )),
                              R(t),
                              e.preventDefault(),
                              e.stopPropagation()
                            );
                        }
                    };
                  })(a)
                )),
            P(n, i);
        }
        function T(e, n) {
          var i = t.data(n, m);
          i && (C(i), t.removeData(n, m));
        }
        function C(t) {
          t.overlay && (q(t, !0), t.overlay.remove(), (t.overlay = null));
        }
        function I(t) {
          var n = {},
            i = t.config || {},
            r = (n.animation = t.el.attr("data-animation") || "default");
          (n.animOver = /^over/.test(r)),
            (n.animDirect = /left$/.test(r) ? -1 : 1),
            i.animation !== r && t.open && e.defer(S, t),
            (n.easing = t.el.attr("data-easing") || "ease"),
            (n.easing2 = t.el.attr("data-easing2") || "ease");
          var o = t.el.attr("data-duration");
          (n.duration = null != o ? Number(o) : 400),
            (n.docHeight = t.el.attr("data-doc-height")),
            (t.config = n);
        }
        function R(t) {
          if (t.links[t.selectedIdx]) {
            var e = t.links[t.selectedIdx];
            e.focus(), z(e);
          }
        }
        function S(t) {
          t.open && (q(t, !0), W(t, !0));
        }
        function L(t) {
          return h(function () {
            t.open ? q(t) : W(t);
          });
        }
        function z(e) {
          return function (n) {
            var r = t(this).attr("href");
            i.validClick(n.currentTarget)
              ? r && 0 === r.indexOf("#") && e.open && q(e)
              : n.preventDefault();
          };
        }
        (c.ready =
          c.design =
          c.preview =
            function () {
              if (
                ((s = p && i.env("design")),
                (u = i.env("editor")),
                (n = t(document.body)),
                !(a = f.find(m)).length)
              )
                return;
              a.each(A), O(), i.resize.on(E);
            }),
          (c.destroy = function () {
            (_ = t()), O(), a && a.length && a.each(T);
          });
        var M = h(function (t, e) {
          if (t.open) {
            var n = e.closest(".w-nav-menu");
            t.menu.is(n) || q(t);
          }
        });
        function P(e, n) {
          var i = t.data(n, m),
            r = (i.collapsed = "none" !== i.button.css("display"));
          if ((!i.open || r || s || q(i, !0), i.container.length)) {
            var o = (function (e) {
              var n = e.container.css(D);
              "none" === n && (n = "");
              return function (e, i) {
                (i = t(i)).css(D, ""), "none" === i.css(D) && i.css(D, n);
              };
            })(i);
            i.links.each(o), i.dropdowns.each(o);
          }
          i.open && F(i);
        }
        var D = "max-width";
        function j(t, e) {
          e.setAttribute("data-nav-menu-open", "");
        }
        function N(t, e) {
          e.removeAttribute("data-nav-menu-open");
        }
        function W(t, e) {
          if (!t.open) {
            (t.open = !0),
              t.menu.each(j),
              t.links.addClass(x),
              t.dropdowns.addClass(w),
              t.dropdownToggle.addClass(y),
              t.dropdownList.addClass(b),
              t.button.addClass(g);
            var n = t.config;
            ("none" !== n.animation && l.support.transform) || (e = !0);
            var r = F(t),
              o = t.menu.outerHeight(!0),
              a = t.menu.outerWidth(!0),
              u = t.el.height(),
              c = t.el[0];
            if (
              (P(0, c),
              k.intro(0, c),
              i.redraw.up(),
              s || f.on("click" + m, t.outside),
              e)
            )
              p();
            else {
              var d = "transform " + n.duration + "ms " + n.easing;
              if (
                (t.overlay &&
                  ((_ = t.menu.prev()), t.overlay.show().append(t.menu)),
                n.animOver)
              )
                return (
                  l(t.menu)
                    .add(d)
                    .set({ x: n.animDirect * a, height: r })
                    .start({ x: 0 })
                    .then(p),
                  void (t.overlay && t.overlay.width(a))
                );
              var h = u + o;
              l(t.menu).add(d).set({ y: -h }).start({ y: 0 }).then(p);
            }
          }
          function p() {
            t.button.attr("aria-expanded", "true");
          }
        }
        function F(t) {
          var e = t.config,
            i = e.docHeight ? f.height() : n.height();
          return (
            e.animOver
              ? t.menu.height(i)
              : "fixed" !== t.el.css("position") && (i -= t.el.outerHeight(!0)),
            t.overlay && t.overlay.height(i),
            i
          );
        }
        function q(t, e) {
          if (t.open) {
            (t.open = !1), t.button.removeClass(g);
            var n = t.config;
            if (
              (("none" === n.animation ||
                !l.support.transform ||
                n.duration <= 0) &&
                (e = !0),
              k.outro(0, t.el[0]),
              f.off("click" + m, t.outside),
              e)
            )
              return l(t.menu).stop(), void u();
            var i = "transform " + n.duration + "ms " + n.easing2,
              r = t.menu.outerHeight(!0),
              o = t.menu.outerWidth(!0),
              a = t.el.height();
            if (n.animOver)
              l(t.menu)
                .add(i)
                .start({ x: o * n.animDirect })
                .then(u);
            else {
              var s = a + r;
              l(t.menu).add(i).start({ y: -s }).then(u);
            }
          }
          function u() {
            t.menu.height(""),
              l(t.menu).set({ x: 0, y: 0 }),
              t.menu.each(N),
              t.links.removeClass(x),
              t.dropdowns.removeClass(w),
              t.dropdownToggle.removeClass(y),
              t.dropdownList.removeClass(b),
              t.overlay &&
                t.overlay.children().length &&
                (_.length ? t.menu.insertAfter(_) : t.menu.prependTo(t.parent),
                t.overlay.attr("style", "").hide()),
              t.el.triggerHandler("w-close"),
              t.button.attr("aria-expanded", "false");
          }
        }
        return c;
      })
    );
  },
  function (t, e, n) {
    "use strict";
    var i = n(0),
      r = n(1);
    i.define(
      "slider",
      (t.exports = function (t, e) {
        var n,
          o,
          a,
          s,
          u = {},
          c = t.tram,
          l = t(document),
          d = i.env(),
          f = ".w-slider",
          h = '<div class="w-slider-dot" data-wf-ignore />',
          p = r.triggers;
        function v() {
          (n = l.find(f)).length &&
            (n.each(w),
            (s = null),
            a || (m(), i.resize.on(g), i.redraw.on(u.redraw)));
        }
        function m() {
          i.resize.off(g), i.redraw.off(u.redraw);
        }
        function g() {
          n.filter(":visible").each(A);
        }
        function w(e, n) {
          var i = t(n),
            r = t.data(n, f);
          if (
            (r || (r = t.data(n, f, { index: 0, depth: 1, el: i, config: {} })),
            (r.mask = i.children(".w-slider-mask")),
            (r.left = i.children(".w-slider-arrow-left")),
            (r.right = i.children(".w-slider-arrow-right")),
            (r.nav = i.children(".w-slider-nav")),
            (r.slides = r.mask.children(".w-slide")),
            r.slides.each(p.reset),
            s && (r.maskWidth = 0),
            !c.support.transform)
          )
            return r.left.hide(), r.right.hide(), r.nav.hide(), void (a = !0);
          r.el.off(f),
            r.left.off(f),
            r.right.off(f),
            r.nav.off(f),
            y(r),
            o
              ? (r.el.on("setting" + f, O(r)), _(r), (r.hasTimer = !1))
              : (r.el.on("swipe" + f, O(r)),
                r.left.on("click" + f, x(r)),
                r.right.on("click" + f, k(r)),
                r.config.autoplay &&
                  !r.hasTimer &&
                  ((r.hasTimer = !0),
                  (r.timerCount = 1),
                  (function t(e) {
                    _(e);
                    var n = e.config;
                    var i = n.timerMax;
                    if (i && e.timerCount++ > i) return;
                    e.timerId = window.setTimeout(function () {
                      null == e.timerId || o || (k(e)(), t(e));
                    }, n.delay);
                  })(r))),
            r.nav.on("click" + f, "> div", O(r)),
            d ||
              r.mask
                .contents()
                .filter(function () {
                  return 3 === this.nodeType;
                })
                .remove();
          var u = i.filter(":hidden");
          u.show();
          var l = i.parents(":hidden");
          l.show(), A(e, n), u.css("display", ""), l.css("display", "");
        }
        function y(t) {
          var e = { crossOver: 0 };
          (e.animation = t.el.attr("data-animation") || "slide"),
            "outin" === e.animation &&
              ((e.animation = "cross"), (e.crossOver = 0.5)),
            (e.easing = t.el.attr("data-easing") || "ease");
          var n = t.el.attr("data-duration");
          if (
            ((e.duration = null != n ? parseInt(n, 10) : 500),
            b(t.el.attr("data-infinite")) && (e.infinite = !0),
            b(t.el.attr("data-disable-swipe")) && (e.disableSwipe = !0),
            b(t.el.attr("data-hide-arrows"))
              ? (e.hideArrows = !0)
              : t.config.hideArrows && (t.left.show(), t.right.show()),
            b(t.el.attr("data-autoplay")))
          ) {
            (e.autoplay = !0),
              (e.delay = parseInt(t.el.attr("data-delay"), 10) || 2e3),
              (e.timerMax = parseInt(t.el.attr("data-autoplay-limit"), 10));
            var i = "mousedown" + f + " touchstart" + f;
            o ||
              t.el.off(i).one(i, function () {
                _(t);
              });
          }
          var r = t.right.width();
          (e.edge = r ? r + 40 : 100), (t.config = e);
        }
        function b(t) {
          return "1" === t || "true" === t;
        }
        function x(t) {
          return function () {
            E(t, { index: t.index - 1, vector: -1 });
          };
        }
        function k(t) {
          return function () {
            E(t, { index: t.index + 1, vector: 1 });
          };
        }
        function _(t) {
          window.clearTimeout(t.timerId), (t.timerId = null);
        }
        function O(n) {
          return function (r, a) {
            a = a || {};
            var s = n.config;
            if (o && "setting" === r.type) {
              if ("prev" === a.select) return x(n)();
              if ("next" === a.select) return k(n)();
              if ((y(n), T(n), null == a.select)) return;
              !(function (n, i) {
                var r = null;
                i === n.slides.length && (v(), T(n)),
                  e.each(n.anchors, function (e, n) {
                    t(e.els).each(function (e, o) {
                      t(o).index() === i && (r = n);
                    });
                  }),
                  null != r && E(n, { index: r, immediate: !0 });
              })(n, a.select);
            } else {
              if ("swipe" === r.type) {
                if (s.disableSwipe) return;
                if (i.env("editor")) return;
                return "left" === a.direction
                  ? k(n)()
                  : "right" === a.direction
                  ? x(n)()
                  : void 0;
              }
              n.nav.has(r.target).length &&
                E(n, { index: t(r.target).index() });
            }
          };
        }
        function E(e, n) {
          n = n || {};
          var i = e.config,
            r = e.anchors;
          e.previous = e.index;
          var a = n.index,
            u = {};
          a < 0
            ? ((a = r.length - 1),
              i.infinite &&
                ((u.x = -e.endX), (u.from = 0), (u.to = r[0].width)))
            : a >= r.length &&
              ((a = 0),
              i.infinite &&
                ((u.x = r[r.length - 1].width),
                (u.from = -r[r.length - 1].x),
                (u.to = u.from - u.x))),
            (e.index = a);
          var l = e.nav.children().eq(e.index).addClass("w-active");
          e.nav.children().not(l).removeClass("w-active"),
            i.hideArrows &&
              (e.index === r.length - 1 ? e.right.hide() : e.right.show(),
              0 === e.index ? e.left.hide() : e.left.show());
          var d = e.offsetX || 0,
            f = (e.offsetX = -r[e.index].x),
            h = { x: f, opacity: 1, visibility: "" },
            v = t(r[e.index].els),
            m = t(r[e.previous] && r[e.previous].els),
            g = e.slides.not(v),
            w = i.animation,
            y = i.easing,
            b = Math.round(i.duration),
            x = n.vector || (e.index > e.previous ? 1 : -1),
            k = "opacity " + b + "ms " + y,
            _ = "transform " + b + "ms " + y;
          if ((o || (v.each(p.intro), g.each(p.outro)), n.immediate && !s))
            return c(v).set(h), void A();
          if (e.index !== e.previous) {
            if ("cross" === w) {
              var O = Math.round(b - b * i.crossOver),
                E = Math.round(b - O);
              return (
                (k = "opacity " + O + "ms " + y),
                c(m).set({ visibility: "" }).add(k).start({ opacity: 0 }),
                void c(v)
                  .set({ visibility: "", x: f, opacity: 0, zIndex: e.depth++ })
                  .add(k)
                  .wait(E)
                  .then({ opacity: 1 })
                  .then(A)
              );
            }
            if ("fade" === w)
              return (
                c(m).set({ visibility: "" }).stop(),
                void c(v)
                  .set({ visibility: "", x: f, opacity: 0, zIndex: e.depth++ })
                  .add(k)
                  .start({ opacity: 1 })
                  .then(A)
              );
            if ("over" === w)
              return (
                (h = { x: e.endX }),
                c(m).set({ visibility: "" }).stop(),
                void c(v)
                  .set({
                    visibility: "",
                    zIndex: e.depth++,
                    x: f + r[e.index].width * x,
                  })
                  .add(_)
                  .start({ x: f })
                  .then(A)
              );
            i.infinite && u.x
              ? (c(e.slides.not(m))
                  .set({ visibility: "", x: u.x })
                  .add(_)
                  .start({ x: f }),
                c(m)
                  .set({ visibility: "", x: u.from })
                  .add(_)
                  .start({ x: u.to }),
                (e.shifted = m))
              : (i.infinite &&
                  e.shifted &&
                  (c(e.shifted).set({ visibility: "", x: d }),
                  (e.shifted = null)),
                c(e.slides).set({ visibility: "" }).add(_).start({ x: f }));
          }
          function A() {
            (v = t(r[e.index].els)),
              (g = e.slides.not(v)),
              "slide" !== w && (h.visibility = "hidden"),
              c(g).set(h);
          }
        }
        function A(e, n) {
          var i = t.data(n, f);
          if (i)
            return (function (t) {
              var e = t.mask.width();
              if (t.maskWidth !== e) return (t.maskWidth = e), !0;
              return !1;
            })(i)
              ? T(i)
              : void (
                  o &&
                  (function (e) {
                    var n = 0;
                    if (
                      (e.slides.each(function (e, i) {
                        n += t(i).outerWidth(!0);
                      }),
                      e.slidesWidth !== n)
                    )
                      return (e.slidesWidth = n), !0;
                    return !1;
                  })(i) &&
                  T(i)
                );
        }
        function T(e) {
          var n = 1,
            i = 0,
            r = 0,
            a = 0,
            s = e.maskWidth,
            u = s - e.config.edge;
          u < 0 && (u = 0),
            (e.anchors = [{ els: [], x: 0, width: 0 }]),
            e.slides.each(function (o, c) {
              r - i > u &&
                (n++,
                (i += s),
                (e.anchors[n - 1] = { els: [], x: r, width: 0 })),
                (a = t(c).outerWidth(!0)),
                (r += a),
                (e.anchors[n - 1].width += a),
                e.anchors[n - 1].els.push(c);
            }),
            (e.endX = r),
            o && (e.pages = null),
            e.nav.length &&
              e.pages !== n &&
              ((e.pages = n),
              (function (e) {
                var n,
                  i = [],
                  r = e.el.attr("data-nav-spacing");
                r && (r = parseFloat(r) + "px");
                for (var o = 0; o < e.pages; o++)
                  (n = t(h)),
                    e.nav.hasClass("w-num") && n.text(o + 1),
                    null != r && n.css({ "margin-left": r, "margin-right": r }),
                    i.push(n);
                e.nav.empty().append(i);
              })(e));
          var c = e.index;
          c >= n && (c = n - 1), E(e, { immediate: !0, index: c });
        }
        return (
          (u.ready = function () {
            (o = i.env("design")), v();
          }),
          (u.design = function () {
            (o = !0), v();
          }),
          (u.preview = function () {
            (o = !1), v();
          }),
          (u.redraw = function () {
            (s = !0), v();
          }),
          (u.destroy = m),
          u
        );
      })
    );
  },
  function (t, e, n) {
    "use strict";
    var i = n(0),
      r = n(1);
    i.define(
      "tabs",
      (t.exports = function (t) {
        var e,
          n,
          o = {},
          a = t.tram,
          s = t(document),
          u = i.env,
          c = u.safari,
          l = u(),
          d = "data-w-tab",
          f = "data-w-pane",
          h = ".w-tabs",
          p = "w--current",
          v = "w--tab-active",
          m = r.triggers,
          g = !1;
        function w() {
          (n = l && i.env("design")),
            (e = s.find(h)).length &&
              (e.each(x),
              i.env("preview") && !g && e.each(b),
              y(),
              i.redraw.on(o.redraw));
        }
        function y() {
          i.redraw.off(o.redraw);
        }
        function b(e, n) {
          var i = t.data(n, h);
          i &&
            (i.links && i.links.each(m.reset),
            i.panes && i.panes.each(m.reset));
        }
        function x(e, i) {
          var r = h.substr(1) + "-" + e,
            o = t(i),
            a = t.data(i, h);
          if (
            (a || (a = t.data(i, h, { el: o, config: {} })),
            (a.current = null),
            (a.tabIdentifier = r + "-" + d),
            (a.paneIdentifier = r + "-" + f),
            (a.menu = o.children(".w-tab-menu")),
            (a.links = a.menu.children(".w-tab-link")),
            (a.content = o.children(".w-tab-content")),
            (a.panes = a.content.children(".w-tab-pane")),
            a.el.off(h),
            a.links.off(h),
            a.menu.attr("role", "tablist"),
            a.links.attr("tabindex", "-1"),
            (function (t) {
              var e = {};
              e.easing = t.el.attr("data-easing") || "ease";
              var n = parseInt(t.el.attr("data-duration-in"), 10);
              n = e.intro = n == n ? n : 0;
              var i = parseInt(t.el.attr("data-duration-out"), 10);
              (i = e.outro = i == i ? i : 0),
                (e.immediate = !n && !i),
                (t.config = e);
            })(a),
            !n)
          ) {
            a.links.on(
              "click" + h,
              (function (t) {
                return function (e) {
                  e.preventDefault();
                  var n = e.currentTarget.getAttribute(d);
                  n && k(t, { tab: n });
                };
              })(a)
            ),
              a.links.on(
                "keydown" + h,
                (function (t) {
                  return function (e) {
                    var n = (function (t) {
                        var e = t.current;
                        return Array.prototype.findIndex.call(
                          t.links,
                          function (t) {
                            return t.getAttribute(d) === e;
                          },
                          null
                        );
                      })(t),
                      i = e.key,
                      r = {
                        ArrowLeft: n - 1,
                        ArrowUp: n - 1,
                        ArrowRight: n + 1,
                        ArrowDown: n + 1,
                        End: t.links.length - 1,
                        Home: 0,
                      };
                    if (i in r) {
                      e.preventDefault();
                      var o = r[i];
                      -1 === o && (o = t.links.length - 1),
                        o === t.links.length && (o = 0);
                      var a = t.links[o],
                        s = a.getAttribute(d);
                      s && k(t, { tab: s });
                    }
                  };
                })(a)
              );
            var s = a.links.filter("." + p).attr(d);
            s && k(a, { tab: s, immediate: !0 });
          }
        }
        function k(e, n) {
          n = n || {};
          var r = e.config,
            o = r.easing,
            s = n.tab;
          if (s !== e.current) {
            var u;
            (e.current = s),
              e.links.each(function (i, o) {
                var a = t(o);
                if (n.immediate || r.immediate) {
                  var c = e.panes[i];
                  o.id || (o.id = e.tabIdentifier + "-" + i),
                    c.id || (c.id = e.paneIdentifier + "-" + i),
                    (o.href = "#" + c.id),
                    o.setAttribute("role", "tab"),
                    o.setAttribute("aria-controls", c.id),
                    o.setAttribute("aria-selected", "false"),
                    c.setAttribute("role", "tabpanel"),
                    c.setAttribute("aria-labelledby", o.id);
                }
                o.getAttribute(d) === s
                  ? ((u = o),
                    a
                      .addClass(p)
                      .removeAttr("tabindex")
                      .attr({ "aria-selected": "true" })
                      .each(m.intro))
                  : a.hasClass(p) &&
                    a
                      .removeClass(p)
                      .attr({ tabindex: "-1", "aria-selected": "false" })
                      .each(m.outro);
              });
            var l = [],
              f = [];
            e.panes.each(function (e, n) {
              var i = t(n);
              n.getAttribute(d) === s ? l.push(n) : i.hasClass(v) && f.push(n);
            });
            var h = t(l),
              w = t(f);
            if (n.immediate || r.immediate)
              return (
                h.addClass(v).each(m.intro),
                w.removeClass(v),
                void (g || i.redraw.up())
              );
            var y = window.scrollX,
              b = window.scrollY;
            u.focus(),
              window.scrollTo(y, b),
              w.length && r.outro
                ? (w.each(m.outro),
                  a(w)
                    .add("opacity " + r.outro + "ms " + o, { fallback: c })
                    .start({ opacity: 0 })
                    .then(function () {
                      return _(r, w, h);
                    }))
                : _(r, w, h);
          }
        }
        function _(t, e, n) {
          if (
            (e
              .removeClass(v)
              .css({
                opacity: "",
                transition: "",
                transform: "",
                width: "",
                height: "",
              }),
            n.addClass(v).each(m.intro),
            i.redraw.up(),
            !t.intro)
          )
            return a(n).set({ opacity: 1 });
          a(n)
            .set({ opacity: 0 })
            .redraw()
            .add("opacity " + t.intro + "ms " + t.easing, { fallback: c })
            .start({ opacity: 1 });
        }
        return (
          (o.ready = o.design = o.preview = w),
          (o.redraw = function () {
            (g = !0), w(), (g = !1);
          }),
          (o.destroy = function () {
            (e = s.find(h)).length && (e.each(b), y());
          }),
          o
        );
      })
    );
  },
  function (t, e, n) {
    "use strict";
    var i = n(0);
    i.define(
      "maps",
      (t.exports = function (t, e) {
        var n,
          r = {},
          o = t(document),
          a = null,
          s = ".w-widget-map",
          u = "";
        function c() {
          i.resize.off(d), i.redraw.off(d);
        }
        function l(e, n) {
          p(n, t(n).data());
        }
        function d() {
          n.each(f);
        }
        function f(t, e) {
          var n = p(e);
          a.maps.event.trigger(n.map, "resize"), n.setMapPosition();
        }
        (r.ready = function () {
          i.env() ||
            (function () {
              if (!(n = o.find(s)).length) return;
              null === a
                ? (t.getScript(
                    "https://maps.googleapis.com/maps/api/js?v=3.31&sensor=false&callback=_wf_maps_loaded&key=" +
                      u
                  ),
                  (window._wf_maps_loaded = e))
                : e();
              function e() {
                (window._wf_maps_loaded = function () {}),
                  (a = window.google),
                  n.each(l),
                  c(),
                  i.resize.on(d),
                  i.redraw.on(d);
              }
            })();
        }),
          (r.destroy = c);
        var h = "w-widget-map";
        function p(e, n) {
          var r = t.data(e, h);
          if (r) return r;
          var o = t(e);
          r = t.data(e, h, {
            latLng: "51.511214,-0.119824",
            tooltip: "",
            style: "roadmap",
            zoom: 12,
            marker: new a.maps.Marker({ draggable: !1 }),
            infowindow: new a.maps.InfoWindow({ disableAutoPan: !0 }),
          });
          var s = n.widgetLatlng || r.latLng;
          r.latLng = s;
          var u = s.split(","),
            c = new a.maps.LatLng(u[0], u[1]);
          r.latLngObj = c;
          var l = !(i.env.touch && n.disableTouch);
          (r.map = new a.maps.Map(e, {
            center: r.latLngObj,
            zoom: r.zoom,
            maxZoom: 18,
            mapTypeControl: !1,
            panControl: !1,
            streetViewControl: !1,
            scrollwheel: !n.disableScroll,
            draggable: l,
            zoomControl: !0,
            zoomControlOptions: { style: a.maps.ZoomControlStyle.SMALL },
            mapTypeId: r.style,
          })),
            r.marker.setMap(r.map),
            (r.setMapPosition = function () {
              r.map.setCenter(r.latLngObj);
              var t = 0,
                e = 0,
                n = o.css([
                  "paddingTop",
                  "paddingRight",
                  "paddingBottom",
                  "paddingLeft",
                ]);
              (t -= parseInt(n.paddingLeft, 10)),
                (t += parseInt(n.paddingRight, 10)),
                (e -= parseInt(n.paddingTop, 10)),
                (e += parseInt(n.paddingBottom, 10)),
                (t || e) && r.map.panBy(t, e),
                o.css("position", "");
            }),
            a.maps.event.addListener(r.map, "tilesloaded", function () {
              a.maps.event.clearListeners(r.map, "tilesloaded"),
                r.setMapPosition();
            }),
            r.setMapPosition(),
            r.marker.setPosition(r.latLngObj),
            r.infowindow.setPosition(r.latLngObj);
          var d = n.widgetTooltip;
          d &&
            ((r.tooltip = d),
            r.infowindow.setContent(d),
            r.infowindowOpen ||
              (r.infowindow.open(r.map, r.marker), (r.infowindowOpen = !0)));
          var f = n.widgetStyle;
          f && r.map.setMapTypeId(f);
          var p = n.widgetZoom;
          return (
            null != p && ((r.zoom = p), r.map.setZoom(Number(p))),
            a.maps.event.addListener(r.marker, "click", function () {
              window.open(
                "https://maps.google.com/?z=" + r.zoom + "&daddr=" + r.latLng
              );
            }),
            r
          );
        }
        return r;
      })
    );
  },
]);
/**
 * ----------------------------------------------------------------------
 * Webflow: Interactions: Init
 */
Webflow.require("ix").init([
  {
    slug: "appointment-height-0px",
    name: "Appointment Height 0px",
    value: { style: { height: "0px" }, triggers: [] },
  },
  {
    slug: "show-appointment-form",
    name: "Show Appointment Form",
    value: {
      style: {},
      triggers: [
        {
          type: "click",
          selector: ".appointment",
          stepsA: [{ height: "auto", transition: "height 500ms ease 0ms" }],
          stepsB: [],
        },
      ],
    },
  },
  {
    slug: "close-modal",
    name: "Close Modal",
    value: {
      style: {},
      triggers: [
        {
          type: "click",
          selector: ".appointment",
          stepsA: [{ height: "0px", transition: "height 500ms ease 0ms" }],
          stepsB: [],
        },
      ],
    },
  },
  {
    slug: "appointment-height-0px-2",
    name: "Appointment Height 0px 2",
    value: { style: { height: "0px" }, triggers: [] },
  },
  {
    slug: "show-faq-answer",
    name: "Show FaQ Answer",
    value: {
      style: {},
      triggers: [
        {
          type: "click",
          selector: ".faq-content-wrapper",
          siblings: true,
          stepsA: [{ height: "auto", transition: "height 300ms ease 0ms" }],
          stepsB: [{ height: "0px", transition: "height 300ms ease 0ms" }],
        },
      ],
    },
  },
  {
    slug: "blue-overlay-opacity-0",
    name: "Blue Overlay Opacity 0",
    value: { style: { opacity: 0 }, triggers: [] },
  },
  {
    slug: "blue-overlay-hover-interaction",
    name: "Blue Overlay Hover Interaction",
    value: {
      style: {},
      triggers: [
        {
          type: "hover",
          selector: ".blue-overlay",
          descend: true,
          stepsA: [{ opacity: 1, transition: "opacity 300ms ease 0ms" }],
          stepsB: [{ opacity: 0, transition: "opacity 300ms ease 0ms" }],
        },
      ],
    },
  },
  {
    slug: "doctor-overlay-icon-first-appear",
    name: "Doctor Overlay Icon First Appear",
    value: {
      style: { opacity: 0, x: "0px", y: "100px", z: "0px" },
      triggers: [],
    },
  },
  {
    slug: "popup-modal-initial-appearance",
    name: "Popup modal Initial Appearance",
    value: {
      style: {
        display: "none",
        opacity: 0,
        scaleX: 1.1,
        scaleY: 1.1,
        scaleZ: 1.1,
      },
      triggers: [],
    },
  },
  {
    slug: "popup-modal-show",
    name: "Popup modal show",
    value: {
      style: {},
      triggers: [
        {
          type: "click",
          selector: ".popup",
          preserve3d: true,
          stepsA: [
            { display: "block" },
            {
              opacity: 1,
              transition: "transform 500ms ease 0ms, opacity 500ms ease 0ms",
              scaleX: 1,
              scaleY: 1,
              scaleZ: 1,
            },
          ],
          stepsB: [],
        },
      ],
    },
  },
  {
    slug: "close-popup",
    name: "Close Popup",
    value: {
      style: {},
      triggers: [
        {
          type: "click",
          selector: ".popup",
          preserve3d: true,
          stepsA: [
            {
              opacity: 0,
              transition: "transform 500ms ease 0ms, opacity 500ms ease 0ms",
              scaleX: 1.1,
              scaleY: 1.1,
              scaleZ: 1.1,
            },
            { display: "none" },
          ],
          stepsB: [],
        },
      ],
    },
  },
  {
    slug: "display-scroll-navbar",
    name: "Display Scroll Navbar",
    value: { style: { display: "none" }, triggers: [] },
  },
  {
    slug: "show-scroll-navbar",
    name: "Show Scroll Navbar",
    value: {
      style: {},
      triggers: [
        {
          type: "scroll",
          selector: ".navbar-scroll",
          offsetTop: "0%",
          preserve3d: true,
          stepsA: [
            {
              transition: "transform 500ms ease 0",
              x: "0px",
              y: "-100%",
              z: "0px",
            },
            { display: "none" },
          ],
          stepsB: [
            {
              display: "block",
              transition: "transform 500ms ease 0",
              x: "0px",
              y: "0px",
              z: "0px",
            },
          ],
        },
      ],
    },
  },
]);
Explain;
// ---- Simple IntersectionObserver reveal ----
(function() {
  var observerSupported = 'IntersectionObserver' in window;

  // Elements to reveal
  var targets = [
    '.service-item',
    '.feature-block',
    '.department-item',
    '.doctor-column',
    '.post-preview-big',
    '.post-mini-wrapper'
  ];

  function addRevealClass(nodeList) {
    for (var i = 0; i < nodeList.length; i++) {
      var el = nodeList[i];
      if (!el) continue;
      // mark the main card inside each item if present
      var card = el.querySelector('.service-box, .department-block, .doctor-card, .post-preview-big, .post-mini-wrapper') || el;
      card.classList.add('reveal');
    }
  }

  targets.forEach(function(sel) {
    addRevealClass(document.querySelectorAll(sel));
  });

  if (observerSupported) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(function(el) {
      io.observe(el);
    });
  } else {
    // Fallback: show immediately
    document.querySelectorAll('.reveal').forEach(function(el) {
      el.classList.add('is-visible');
    });
  }

  // ---- Navbar shrink on scroll ----
  var navbars = document.querySelectorAll('.navbar.w-nav, .navbar-scroll.w-nav');
  var lastY = window.scrollY || window.pageYOffset;

  function updateNavbar() {
    var y = window.scrollY || window.pageYOffset;
    navbars.forEach(function(nb) {
      if (y > 24) nb.classList.add('shrink');
      else nb.classList.remove('shrink');
    });
    lastY = y;
  }

  updateNavbar();
  window.addEventListener('scroll', updateNavbar, { passive: true });
})();
// --- Doctor modal (popup on click) ---
(function () {
  // Map the doctor profile slug (from href) to structured data
  // Update these values to match real information
  var DOCTORS = {
    "john-doe": {
      name: "Dr. Jack Doe",
      category: "Neurology",
      code: "DOC-NEU-001",
      email: "jack.doe@rxconnect.com",
      phone: "+44 20 7123 4567",
      location: "Salford, Manchester",
      avatar: "https://cdn.prod.website-files.com/57c92a057d70832a62312ae9/58944c4e0b064a800fc31f95_slice6.jpg",
      bio: "Board-certified neurologist with focus on migraine, epilepsy, and movement disorders."
    },
    "william-james": {
      name: "Dr. William Doe",
      category: "Cardiology",
      code: "DOC-CARD-014",
      email: "william.doe@rxconnect.com",
      phone: "+44 7712 345678",
      location: "Salford, Manchester",
      avatar: "https://cdn.prod.website-files.com/57c92a057d70832a62312ae9/58944a3e8031687f489ab20f_slice1.jpg",
      bio: "Interventional cardiologist specializing in coronary artery disease and heart failure."
    },
    "jessica-smith": {
      name: "Dr. Jessica Doe",
      category: "Dentistry",
      code: "DOC-DENT-031",
      email: "jessica.doe@rxconnect.com",
      phone: "+44 20 7123 4567",
      location: "Salford, Manchester",
      avatar: "https://cdn.prod.website-files.com/57c92a057d70832a62312ae9/589449e0e9bfbc310322a87d_slice7.jpg",
      bio: "General dentist with interest in cosmetic and pediatric dentistry."
    }
  };

  // Create modal DOM once and reuse
  var overlay = document.createElement('div');
  overlay.className = 'rx-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = [
    '<div class="rx-modal" role="document">',
      '<div class="rx-modal-header">',
        '<div class="rx-modal-avatar" id="rxAvatar"></div>',
        '<div>',
          '<h3 class="rx-modal-title" id="rxTitle"></h3>',
          '<div class="rx-modal-sub" id="rxSub"></div>',
        '</div>',
      '</div>',
      '<div class="rx-modal-body">',
        '<p id="rxBio" style="margin-top:0;margin-bottom:14px;color:#333;"></p>',
        '<dl class="rx-meta">',
          '<dt>Doctor Code</dt><dd id="rxCode"></dd>',
          '<dt>Category</dt><dd id="rxCategory"></dd>',
          '<dt>Email</dt><dd id="rxEmail"></dd>',
          '<dt>Phone</dt><dd id="rxPhone"></dd>',
          '<dt>Location</dt><dd id="rxLocation"></dd>',
        '</dl>',
      '</div>',
      '<div class="rx-modal-footer">',
        '<button type="button" class="rx-close-btn" data-rx="close">Close</button>',
        '<a id="rxProfileLink" class="rx-close-btn rx-primary-btn" href="#" target="_self" rel="noopener">View full profile</a>',
      '</div>',
    '</div>'
  ].join('');
  document.body.appendChild(overlay);

  function openModal(data, profileHref) {
    // Fill content
    overlay.querySelector('#rxAvatar').style.backgroundImage = 'url("' + (data.avatar || '') + '")';
    overlay.querySelector('#rxTitle').textContent = data.name || 'Doctor';
    overlay.querySelector('#rxSub').textContent = data.category || '';
    overlay.querySelector('#rxBio').textContent = data.bio || '';
    overlay.querySelector('#rxCode').textContent = data.code || '';
    overlay.querySelector('#rxCategory').textContent = data.category || '';
    overlay.querySelector('#rxEmail').textContent = data.email || '';
    overlay.querySelector('#rxPhone').textContent = data.phone || '';
    overlay.querySelector('#rxLocation').textContent = data.location || '';
    overlay.querySelector('#rxProfileLink').setAttribute('href', profileHref || '#');

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    // basic focus handling
    var closeBtn = overlay.querySelector('[data-rx="close"]');
    closeBtn.focus({ preventScroll: true });

    // esc to close
    document.addEventListener('keydown', escHandler, { passive: true });
  }

  function closeModal() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', escHandler);
  }

  function escHandler(e) {
    if (e.key === 'Escape') closeModal();
  }

  // Click outside or on Close
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay || e.target.getAttribute('data-rx') === 'close') {
      e.preventDefault();
      closeModal();
    }
  });

  // Delegate click on doctor cards
  document.addEventListener('click', function (e) {
    var card = e.target.closest('.doctor-card');
    if (!card) return;

    // Only handle clicks within the “Our Clinical Advisors” section
    var section = card.closest('.section');
    if (!section) return;

    // This card is an anchor with href like /doctors/john-doe
    var href = card.getAttribute('href') || '';
    if (!href) return;

    // extract slug from href
    var slug = href.split('/').filter(Boolean).pop(); // "john-doe"
    var info = DOCTORS[slug];

    if (info) {
      e.preventDefault();
      openModal(info, href);
    }
    // If not found in map, allow normal navigation to the profile page
  }, { passive: false });
})();
