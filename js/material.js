/*
 The MIT License (MIT)
 @todo Lazy Load Icon
 @todo prevent animationend bubling
 @todo itemsScaleUp
 @todo Test Zepto
 @todo stagePadding calculate wrong active classes
 The MIT License (MIT)
*/
(function (c, f, l, k) {
  function d(a, b) {
    this.settings = null;
    this.options = c.extend({}, d.Defaults, b);
    this.$element = c(a);
    this._handlers = {};
    this._plugins = {};
    this._supress = {};
    this._speed = this._current = null;
    this._coordinates = [];
    this._width = this._breakpoint = null;
    this._items = [];
    this._clones = [];
    this._mergers = [];
    this._widths = [];
    this._invalidated = {};
    this._pipe = [];
    this._drag = {
      time: null,
      target: null,
      pointer: null,
      stage: { start: null, current: null },
      direction: null,
    };
    this._states = {
      current: {},
      tags: {
        initializing: ["busy"],
        animating: ["busy"],
        dragging: ["interacting"],
      },
    };
    c.each(
      ["onResize", "onThrottledResize"],
      c.proxy(function (a, b) {
        this._handlers[b] = c.proxy(this[b], this);
      }, this)
    );
    c.each(
      d.Plugins,
      c.proxy(function (a, b) {
        this._plugins[a.charAt(0).toLowerCase() + a.slice(1)] = new b(this);
      }, this)
    );
    c.each(
      d.Workers,
      c.proxy(function (a, b) {
        this._pipe.push({ filter: b.filter, run: c.proxy(b.run, this) });
      }, this)
    );
    this.setup();
    this.initialize();
  }
  d.Defaults = {
    items: 3,
    loop: !1,
    center: !1,
    rewind: !1,
    mouseDrag: !0,
    touchDrag: !0,
    pullDrag: !0,
    freeDrag: !1,
    margin: 0,
    stagePadding: 0,
    merge: !1,
    mergeFit: !0,
    autoWidth: !1,
    startPosition: 0,
    rtl: !1,
    smartSpeed: 250,
    fluidSpeed: !1,
    dragEndSpeed: !1,
    responsive: {},
    responsiveRefreshRate: 200,
    responsiveBaseElement: f,
    fallbackEasing: "swing",
    info: !1,
    nestedItemSelector: !1,
    itemElement: "div",
    stageElement: "div",
    refreshClass: "owl-refresh",
    loadedClass: "owl-loaded",
    loadingClass: "owl-loading",
    rtlClass: "owl-rtl",
    responsiveClass: "owl-responsive",
    dragClass: "owl-drag",
    itemClass: "owl-item",
    stageClass: "owl-stage",
    stageOuterClass: "owl-stage-outer",
    grabClass: "owl-grab",
  };
  d.Width = { Default: "default", Inner: "inner", Outer: "outer" };
  d.Type = { Event: "event", State: "state" };
  d.Plugins = {};
  d.Workers = [
    {
      filter: ["width", "settings"],
      run: function () {
        this._width = this.$element.width();
      },
    },
    {
      filter: ["width", "items", "settings"],
      run: function (a) {
        a.current = this._items && this._items[this.relative(this._current)];
      },
    },
    {
      filter: ["items", "settings"],
      run: function () {
        this.$stage.children(".cloned").remove();
      },
    },
    {
      filter: ["width", "items", "settings"],
      run: function (a) {
        var b = this.settings.margin || "",
          e = this.settings.rtl;
        b = {
          width: "auto",
          "margin-left": e ? b : "",
          "margin-right": e ? "" : b,
        };
        this.settings.autoWidth && this.$stage.children().css(b);
        a.css = b;
      },
    },
    {
      filter: ["width", "items", "settings"],
      run: function (a) {
        var b =
            (this.width() / this.settings.items).toFixed(3) -
            this.settings.margin,
          e = this._items.length,
          c = !this.settings.autoWidth,
          d = [];
        for (a.items = { merge: !1, width: b }; e--; ) {
          var g = this._mergers[e];
          g = (this.settings.mergeFit && Math.min(g, this.settings.items)) || g;
          a.items.merge = 1 < g || a.items.merge;
          d[e] = c ? b * g : this._items[e].width();
        }
        this._widths = d;
      },
    },
    {
      filter: ["items", "settings"],
      run: function () {
        var a = [],
          b = this._items,
          e = this.settings,
          d = Math.max(2 * e.items, 4),
          h = 2 * Math.ceil(b.length / 2);
        e = e.loop && b.length ? (e.rewind ? d : Math.max(d, h)) : 0;
        h = d = "";
        for (e /= 2; e--; )
          a.push(this.normalize(a.length / 2, !0)),
            (d += b[a[a.length - 1]][0].outerHTML),
            a.push(this.normalize(b.length - 1 - (a.length - 1) / 2, !0)),
            (h = b[a[a.length - 1]][0].outerHTML + h);
        this._clones = a;
        c(d).addClass("cloned").appendTo(this.$stage);
        c(h).addClass("cloned").prependTo(this.$stage);
      },
    },
    {
      filter: ["width", "items", "settings"],
      run: function () {
        for (
          var a = this.settings.rtl ? 1 : -1,
            b = this._clones.length + this._items.length,
            e = -1,
            c,
            d,
            g = [];
          ++e < b;

        )
          (c = g[e - 1] || 0),
            (d = this._widths[this.relative(e)] + this.settings.margin),
            g.push(c + d * a);
        this._coordinates = g;
      },
    },
    {
      filter: ["width", "items", "settings"],
      run: function () {
        var a = this.settings.stagePadding,
          b = this._coordinates;
        this.$stage.css({
          width: Math.ceil(Math.abs(b[b.length - 1])) + 2 * a,
          "padding-left": a || "",
          "padding-right": a || "",
        });
      },
    },
    {
      filter: ["width", "items", "settings"],
      run: function (a) {
        var b = this._coordinates.length,
          e = !this.settings.autoWidth,
          c = this.$stage.children();
        if (e && a.items.merge)
          for (; b--; )
            (a.css.width = this._widths[this.relative(b)]), c.eq(b).css(a.css);
        else e && ((a.css.width = a.items.width), c.css(a.css));
      },
    },
    {
      filter: ["items"],
      run: function () {
        1 > this._coordinates.length && this.$stage.removeAttr("style");
      },
    },
    {
      filter: ["width", "items", "settings"],
      run: function (a) {
        a.current = a.current ? this.$stage.children().index(a.current) : 0;
        a.current = Math.max(
          this.minimum(),
          Math.min(this.maximum(), a.current)
        );
        this.reset(a.current);
      },
    },
    {
      filter: ["position"],
      run: function () {
        this.animate(this.coordinates(this._current));
      },
    },
    {
      filter: ["width", "position", "items", "settings"],
      run: function () {
        var a = this.settings.rtl ? 1 : -1,
          b = 2 * this.settings.stagePadding,
          e = this.coordinates(this.current()) + b,
          c = e + this.width() * a,
          d = [],
          g;
        var n = 0;
        for (g = this._coordinates.length; n < g; n++) {
          var f = this._coordinates[n - 1] || 0;
          var k = Math.abs(this._coordinates[n]) + b * a;
          ((this.op(f, "\x3c\x3d", e) && this.op(f, "\x3e", c)) ||
            (this.op(k, "\x3c", e) && this.op(k, "\x3e", c))) &&
            d.push(n);
        }
        this.$stage.children(".active").removeClass("active");
        this.$stage
          .children(":eq(" + d.join("), :eq(") + ")")
          .addClass("active");
        this.settings.center &&
          (this.$stage.children(".center").removeClass("center"),
          this.$stage.children().eq(this.current()).addClass("center"));
      },
    },
  ];
  d.prototype.initialize = function () {
    this.enter("initializing");
    this.trigger("initialize");
    this.$element.toggleClass(this.settings.rtlClass, this.settings.rtl);
    if (this.settings.autoWidth && !this.is("pre-loading")) {
      var a = this.$element.find("img");
      var b = this.$element
        .children(
          this.settings.nestedItemSelector
            ? "." + this.settings.nestedItemSelector
            : k
        )
        .width();
      a.length && 0 >= b && this.preloadAutoWidthImages(a);
    }
    this.$element.addClass(this.options.loadingClass);
    this.$stage = c(
      "\x3c" +
        this.settings.stageElement +
        ' class\x3d"' +
        this.settings.stageClass +
        '" /\x3e'
    ).wrap('\x3cdiv class\x3d"' + this.settings.stageOuterClass + '" /\x3e');
    this.$element.append(this.$stage.parent());
    this.replace(this.$element.children().not(this.$stage.parent()));
    this.$element.is(":visible") ? this.refresh() : this.invalidate("width");
    this.$element
      .removeClass(this.options.loadingClass)
      .addClass(this.options.loadedClass);
    this.registerEventHandlers();
    this.leave("initializing");
    this.trigger("initialized");
  };
  d.prototype.setup = function () {
    var a = this.viewport(),
      b = this.options.responsive,
      e = -1,
      d = null;
    b
      ? (c.each(b, function (b) {
          b <= a && b > e && (e = Number(b));
        }),
        (d = c.extend({}, this.options, b[e])),
        "function" === typeof d.stagePadding &&
          (d.stagePadding = d.stagePadding()),
        delete d.responsive,
        d.responsiveClass &&
          this.$element.attr(
            "class",
            this.$element
              .attr("class")
              .replace(
                new RegExp(
                  "(" + this.options.responsiveClass + "-)\\S+\\s",
                  "g"
                ),
                "$1" + e
              )
          ))
      : (d = c.extend({}, this.options));
    this.trigger("change", { property: { name: "settings", value: d } });
    this._breakpoint = e;
    this.settings = d;
    this.invalidate("settings");
    this.trigger("changed", {
      property: { name: "settings", value: this.settings },
    });
  };
  d.prototype.optionsLogic = function () {
    this.settings.autoWidth &&
      ((this.settings.stagePadding = !1), (this.settings.merge = !1));
  };
  d.prototype.prepare = function (a) {
    var b = this.trigger("prepare", { content: a });
    b.data ||
      (b.data = c("\x3c" + this.settings.itemElement + "/\x3e")
        .addClass(this.options.itemClass)
        .append(a));
    this.trigger("prepared", { content: b.data });
    return b.data;
  };
  d.prototype.update = function () {
    for (
      var a = 0,
        b = this._pipe.length,
        e = c.proxy(function (a) {
          return this[a];
        }, this._invalidated),
        d = {};
      a < b;

    )
      (this._invalidated.all || 0 < c.grep(this._pipe[a].filter, e).length) &&
        this._pipe[a].run(d),
        a++;
    this._invalidated = {};
    !this.is("valid") && this.enter("valid");
  };
  d.prototype.width = function (a) {
    a = a || d.Width.Default;
    switch (a) {
      case d.Width.Inner:
      case d.Width.Outer:
        return this._width;
      default:
        return (
          this._width - 2 * this.settings.stagePadding + this.settings.margin
        );
    }
  };
  d.prototype.refresh = function () {
    this.enter("refreshing");
    this.trigger("refresh");
    this.setup();
    this.optionsLogic();
    this.$element.addClass(this.options.refreshClass);
    this.update();
    this.$element.removeClass(this.options.refreshClass);
    this.leave("refreshing");
    this.trigger("refreshed");
  };
  d.prototype.onThrottledResize = function () {
    f.clearTimeout(this.resizeTimer);
    this.resizeTimer = f.setTimeout(
      this._handlers.onResize,
      this.settings.responsiveRefreshRate
    );
  };
  d.prototype.onResize = function () {
    if (
      !this._items.length ||
      this._width === this.$element.width() ||
      !this.$element.is(":visible")
    )
      return !1;
    this.enter("resizing");
    if (this.trigger("resize").isDefaultPrevented())
      return this.leave("resizing"), !1;
    this.invalidate("width");
    this.refresh();
    this.leave("resizing");
    this.trigger("resized");
  };
  d.prototype.registerEventHandlers = function () {
    if (c.support.transition)
      this.$stage.on(
        c.support.transition.end + ".owl.core",
        c.proxy(this.onTransitionEnd, this)
      );
    if (!1 !== this.settings.responsive)
      this.on(f, "resize", this._handlers.onThrottledResize);
    this.settings.mouseDrag &&
      (this.$element.addClass(this.options.dragClass),
      this.$stage.on("mousedown.owl.core", c.proxy(this.onDragStart, this)),
      this.$stage.on("dragstart.owl.core selectstart.owl.core", function () {
        return !1;
      }));
    this.settings.touchDrag &&
      (this.$stage.on("touchstart.owl.core", c.proxy(this.onDragStart, this)),
      this.$stage.on("touchcancel.owl.core", c.proxy(this.onDragEnd, this)));
  };
  d.prototype.onDragStart = function (a) {
    var b = null;
    3 !== a.which &&
      (c.support.transform
        ? ((b = this.$stage
            .css("transform")
            .replace(/.*\(|\)| /g, "")
            .split(",")),
          (b = {
            x: b[16 === b.length ? 12 : 4],
            y: b[16 === b.length ? 13 : 5],
          }))
        : ((b = this.$stage.position()),
          (b = {
            x: this.settings.rtl
              ? b.left +
                this.$stage.width() -
                this.width() +
                this.settings.margin
              : b.left,
            y: b.top,
          })),
      this.is("animating") &&
        (c.support.transform ? this.animate(b.x) : this.$stage.stop(),
        this.invalidate("position")),
      this.$element.toggleClass(this.options.grabClass, "mousedown" === a.type),
      this.speed(0),
      (this._drag.time = new Date().getTime()),
      (this._drag.target = c(a.target)),
      (this._drag.stage.start = b),
      (this._drag.stage.current = b),
      (this._drag.pointer = this.pointer(a)),
      c(l).on(
        "mouseup.owl.core touchend.owl.core",
        c.proxy(this.onDragEnd, this)
      ),
      c(l).one(
        "mousemove.owl.core touchmove.owl.core",
        c.proxy(function (a) {
          var b = this.difference(this._drag.pointer, this.pointer(a));
          c(l).on(
            "mousemove.owl.core touchmove.owl.core",
            c.proxy(this.onDragMove, this)
          );
          (Math.abs(b.x) < Math.abs(b.y) && this.is("valid")) ||
            (a.preventDefault(), this.enter("dragging"), this.trigger("drag"));
        }, this)
      ));
  };
  d.prototype.onDragMove = function (a) {
    var b = this.difference(this._drag.pointer, this.pointer(a));
    var c = this.difference(this._drag.stage.start, b);
    if (this.is("dragging")) {
      a.preventDefault();
      if (this.settings.loop) {
        a = this.coordinates(this.minimum());
        var d = this.coordinates(this.maximum() + 1) - a;
        c.x = ((((c.x - a) % d) + d) % d) + a;
      } else
        (a = this.settings.rtl
          ? this.coordinates(this.maximum())
          : this.coordinates(this.minimum())),
          (d = this.settings.rtl
            ? this.coordinates(this.minimum())
            : this.coordinates(this.maximum())),
          (b = this.settings.pullDrag ? (-1 * b.x) / 5 : 0),
          (c.x = Math.max(Math.min(c.x, a + b), d + b));
      this._drag.stage.current = c;
      this.animate(c.x);
    }
  };
  d.prototype.onDragEnd = function (a) {
    a = this.difference(this._drag.pointer, this.pointer(a));
    var b = this._drag.stage.current,
      e = (0 < a.x) ^ this.settings.rtl ? "left" : "right";
    c(l).off(".owl.core");
    this.$element.removeClass(this.options.grabClass);
    if ((0 !== a.x && this.is("dragging")) || !this.is("valid"))
      if (
        (this.speed(this.settings.dragEndSpeed || this.settings.smartSpeed),
        this.current(this.closest(b.x, 0 !== a.x ? e : this._drag.direction)),
        this.invalidate("position"),
        this.update(),
        (this._drag.direction = e),
        3 < Math.abs(a.x) || 300 < new Date().getTime() - this._drag.time)
      )
        this._drag.target.one("click.owl.core", function () {
          return !1;
        });
    this.is("dragging") && (this.leave("dragging"), this.trigger("dragged"));
  };
  d.prototype.closest = function (a, b) {
    var e = -1,
      d = this.width(),
      h = this.coordinates();
    this.settings.freeDrag ||
      c.each(
        h,
        c.proxy(function (c, m) {
          "left" === b && a > m - 30 && a < m + 30
            ? (e = c)
            : "right" === b && a > m - d - 30 && a < m - d + 30
            ? (e = c + 1)
            : this.op(a, "\x3c", m) &&
              this.op(a, "\x3e", h[c + 1] || m - d) &&
              (e = "left" === b ? c + 1 : c);
          return -1 === e;
        }, this)
      );
    this.settings.loop ||
      (this.op(a, "\x3e", h[this.minimum()])
        ? (e = a = this.minimum())
        : this.op(a, "\x3c", h[this.maximum()]) && (e = a = this.maximum()));
    return e;
  };
  d.prototype.animate = function (a) {
    var b = 0 < this.speed();
    this.is("animating") && this.onTransitionEnd();
    b && (this.enter("animating"), this.trigger("translate"));
    c.support.transform3d && c.support.transition
      ? this.$stage.css({
          transform: "translate3d(" + a + "px,0px,0px)",
          transition: this.speed() / 1e3 + "s",
        })
      : b
      ? this.$stage.animate(
          { left: a + "px" },
          this.speed(),
          this.settings.fallbackEasing,
          c.proxy(this.onTransitionEnd, this)
        )
      : this.$stage.css({ left: a + "px" });
  };
  d.prototype.is = function (a) {
    return this._states.current[a] && 0 < this._states.current[a];
  };
  d.prototype.current = function (a) {
    if (a === k) return this._current;
    if (0 === this._items.length) return k;
    a = this.normalize(a);
    if (this._current !== a) {
      var b = this.trigger("change", {
        property: { name: "position", value: a },
      });
      b.data !== k && (a = this.normalize(b.data));
      this._current = a;
      this.invalidate("position");
      this.trigger("changed", {
        property: { name: "position", value: this._current },
      });
    }
    return this._current;
  };
  d.prototype.invalidate = function (a) {
    "string" === c.type(a) &&
      ((this._invalidated[a] = !0), this.is("valid") && this.leave("valid"));
    return c.map(this._invalidated, function (a, c) {
      return c;
    });
  };
  d.prototype.reset = function (a) {
    a = this.normalize(a);
    a !== k &&
      ((this._speed = 0),
      (this._current = a),
      this.suppress(["translate", "translated"]),
      this.animate(this.coordinates(a)),
      this.release(["translate", "translated"]));
  };
  d.prototype.normalize = function (a, b) {
    var c = this._items.length;
    b = b ? 0 : this._clones.length;
    if (!this.isNumeric(a) || 1 > c) a = k;
    else if (0 > a || a >= c + b) a = ((((a - b / 2) % c) + c) % c) + b / 2;
    return a;
  };
  d.prototype.relative = function (a) {
    a -= this._clones.length / 2;
    return this.normalize(a, !0);
  };
  d.prototype.maximum = function (a) {
    var b = this.settings,
      c;
    if (b.loop) b = this._clones.length / 2 + this._items.length - 1;
    else if (b.autoWidth || b.merge) {
      b = this._items.length;
      var d = this._items[--b].width();
      for (
        c = this.$element.width();
        b-- && !((d += this._items[b].width() + this.settings.margin), d > c);

      );
      b += 1;
    } else b = b.center ? this._items.length - 1 : this._items.length - b.items;
    a && (b -= this._clones.length / 2);
    return Math.max(b, 0);
  };
  d.prototype.minimum = function (a) {
    return a ? 0 : this._clones.length / 2;
  };
  d.prototype.items = function (a) {
    if (a === k) return this._items.slice();
    a = this.normalize(a, !0);
    return this._items[a];
  };
  d.prototype.mergers = function (a) {
    if (a === k) return this._mergers.slice();
    a = this.normalize(a, !0);
    return this._mergers[a];
  };
  d.prototype.clones = function (a) {
    var b = this._clones.length / 2,
      e = b + this._items.length;
    return a === k
      ? c.map(this._clones, function (a, c) {
          return 0 === c % 2 ? e + c / 2 : b - (c + 1) / 2;
        })
      : c.map(this._clones, function (c, d) {
          return c === a ? (0 === d % 2 ? e + d / 2 : b - (d + 1) / 2) : null;
        });
  };
  d.prototype.speed = function (a) {
    a !== k && (this._speed = a);
    return this._speed;
  };
  d.prototype.coordinates = function (a) {
    var b = 1,
      e = a - 1;
    if (a === k)
      return c.map(
        this._coordinates,
        c.proxy(function (a, b) {
          return this.coordinates(b);
        }, this)
      );
    this.settings.center
      ? (this.settings.rtl && ((b = -1), (e = a + 1)),
        (a = this._coordinates[a]),
        (a += ((this.width() - a + (this._coordinates[e] || 0)) / 2) * b))
      : (a = this._coordinates[e] || 0);
    return (a = Math.ceil(a));
  };
  d.prototype.duration = function (a, b, c) {
    return 0 === c
      ? 0
      : Math.min(Math.max(Math.abs(b - a), 1), 6) *
          Math.abs(c || this.settings.smartSpeed);
  };
  d.prototype.to = function (a, b) {
    var c = this.current(),
      d = a - this.relative(c);
    var h = (0 < d) - (0 > d);
    var g = this._items.length,
      f = this.minimum(),
      k = this.maximum();
    this.settings.loop
      ? (!this.settings.rewind && Math.abs(d) > g / 2 && (d += -1 * h * g),
        (a = c + d),
        (h = ((((a - f) % g) + g) % g) + f),
        h !== a &&
          h - d <= k &&
          0 < h - d &&
          ((c = h - d), (a = h), this.reset(c)))
      : this.settings.rewind
      ? ((k += 1), (a = ((a % k) + k) % k))
      : (a = Math.max(f, Math.min(k, a)));
    this.speed(this.duration(c, a, b));
    this.current(a);
    this.$element.is(":visible") && this.update();
  };
  d.prototype.next = function (a) {
    a = a || !1;
    this.to(this.relative(this.current()) + 1, a);
  };
  d.prototype.prev = function (a) {
    a = a || !1;
    this.to(this.relative(this.current()) - 1, a);
  };
  d.prototype.onTransitionEnd = function (a) {
    if (
      a !== k &&
      (a.stopPropagation(),
      (a.target || a.srcElement || a.originalTarget) !== this.$stage.get(0))
    )
      return !1;
    this.leave("animating");
    this.trigger("translated");
  };
  d.prototype.viewport = function () {
    if (this.options.responsiveBaseElement !== f)
      var a = c(this.options.responsiveBaseElement).width();
    else if (f.innerWidth) a = f.innerWidth;
    else if (l.documentElement && l.documentElement.clientWidth)
      a = l.documentElement.clientWidth;
    else throw "Can not detect viewport width.";
    return a;
  };
  d.prototype.replace = function (a) {
    this.$stage.empty();
    this._items = [];
    a && (a = a instanceof jQuery ? a : c(a));
    this.settings.nestedItemSelector &&
      (a = a.find("." + this.settings.nestedItemSelector));
    a.filter(function () {
      return 1 === this.nodeType;
    }).each(
      c.proxy(function (a, c) {
        c = this.prepare(c);
        this.$stage.append(c);
        this._items.push(c);
        this._mergers.push(
          1 *
            c.find("[data-merge]").addBack("[data-merge]").attr("data-merge") ||
            1
        );
      }, this)
    );
    this.reset(
      this.isNumeric(this.settings.startPosition)
        ? this.settings.startPosition
        : 0
    );
    this.invalidate("items");
  };
  d.prototype.add = function (a, b) {
    var d = this.relative(this._current);
    b = b === k ? this._items.length : this.normalize(b, !0);
    a = a instanceof jQuery ? a : c(a);
    this.trigger("add", { content: a, position: b });
    a = this.prepare(a);
    0 === this._items.length || b === this._items.length
      ? (0 === this._items.length && this.$stage.append(a),
        0 !== this._items.length && this._items[b - 1].after(a),
        this._items.push(a),
        this._mergers.push(
          1 *
            a.find("[data-merge]").addBack("[data-merge]").attr("data-merge") ||
            1
        ))
      : (this._items[b].before(a),
        this._items.splice(b, 0, a),
        this._mergers.splice(
          b,
          0,
          1 *
            a.find("[data-merge]").addBack("[data-merge]").attr("data-merge") ||
            1
        ));
    this._items[d] && this.reset(this._items[d].index());
    this.invalidate("items");
    this.trigger("added", { content: a, position: b });
  };
  d.prototype.remove = function (a) {
    a = this.normalize(a, !0);
    a !== k &&
      (this.trigger("remove", { content: this._items[a], position: a }),
      this._items[a].remove(),
      this._items.splice(a, 1),
      this._mergers.splice(a, 1),
      this.invalidate("items"),
      this.trigger("removed", { content: null, position: a }));
  };
  d.prototype.preloadAutoWidthImages = function (a) {
    a.each(
      c.proxy(function (a, d) {
        this.enter("pre-loading");
        d = c(d);
        c(new Image())
          .one(
            "load",
            c.proxy(function (a) {
              d.attr("src", a.target.src);
              d.css("opacity", 1);
              this.leave("pre-loading");
              this.is("pre-loading") ||
                this.is("initializing") ||
                this.refresh();
            }, this)
          )
          .attr(
            "src",
            d.attr("src") || d.attr("data-src") || d.attr("data-src-retina")
          );
      }, this)
    );
  };
  d.prototype.destroy = function () {
    this.$element.off(".owl.core");
    this.$stage.off(".owl.core");
    c(l).off(".owl.core");
    !1 !== this.settings.responsive &&
      (f.clearTimeout(this.resizeTimer),
      this.off(f, "resize", this._handlers.onThrottledResize));
    for (var a in this._plugins) this._plugins[a].destroy();
    this.$stage.children(".cloned").remove();
    this.$stage.unwrap();
    this.$stage.children().contents().unwrap();
    this.$stage.children().unwrap();
    this.$element
      .removeClass(this.options.refreshClass)
      .removeClass(this.options.loadingClass)
      .removeClass(this.options.loadedClass)
      .removeClass(this.options.rtlClass)
      .removeClass(this.options.dragClass)
      .removeClass(this.options.grabClass)
      .attr(
        "class",
        this.$element
          .attr("class")
          .replace(
            new RegExp(this.options.responsiveClass + "-\\S+\\s", "g"),
            ""
          )
      )
      .removeData("owl.carousel");
  };
  d.prototype.op = function (a, b, c) {
    var d = this.settings.rtl;
    switch (b) {
      case "\x3c":
        return d ? a > c : a < c;
      case "\x3e":
        return d ? a < c : a > c;
      case "\x3e\x3d":
        return d ? a <= c : a >= c;
      case "\x3c\x3d":
        return d ? a >= c : a <= c;
    }
  };
  d.prototype.on = function (a, b, c, d) {
    a.addEventListener
      ? a.addEventListener(b, c, d)
      : a.attachEvent && a.attachEvent("on" + b, c);
  };
  d.prototype.off = function (a, b, c, d) {
    a.removeEventListener
      ? a.removeEventListener(b, c, d)
      : a.detachEvent && a.detachEvent("on" + b, c);
  };
  d.prototype.trigger = function (a, b, e, m, h) {
    m = { item: { count: this._items.length, index: this.current() } };
    h = c.camelCase(
      c
        .grep(["on", a, e], function (a) {
          return a;
        })
        .join("-")
        .toLowerCase()
    );
    var g = c.Event(
      [a, "owl", e || "carousel"].join(".").toLowerCase(),
      c.extend({ relatedTarget: this }, m, b)
    );
    this._supress[a] ||
      (c.each(this._plugins, function (a, b) {
        if (b.onTrigger) b.onTrigger(g);
      }),
      this.register({ type: d.Type.Event, name: a }),
      this.$element.trigger(g),
      this.settings &&
        "function" === typeof this.settings[h] &&
        this.settings[h].call(this, g));
    return g;
  };
  d.prototype.enter = function (a) {
    c.each(
      [a].concat(this._states.tags[a] || []),
      c.proxy(function (a, c) {
        this._states.current[c] === k && (this._states.current[c] = 0);
        this._states.current[c]++;
      }, this)
    );
  };
  d.prototype.leave = function (a) {
    c.each(
      [a].concat(this._states.tags[a] || []),
      c.proxy(function (a, c) {
        this._states.current[c]--;
      }, this)
    );
  };
  d.prototype.register = function (a) {
    if (a.type === d.Type.Event) {
      if (
        (c.event.special[a.name] || (c.event.special[a.name] = {}),
        !c.event.special[a.name].owl)
      ) {
        var b = c.event.special[a.name]._default;
        c.event.special[a.name]._default = function (a) {
          return !b ||
            !b.apply ||
            (a.namespace && -1 !== a.namespace.indexOf("owl"))
            ? a.namespace && -1 < a.namespace.indexOf("owl")
            : b.apply(this, arguments);
        };
        c.event.special[a.name].owl = !0;
      }
    } else
      a.type === d.Type.State &&
        ((this._states.tags[a.name] = this._states.tags[a.name]
          ? this._states.tags[a.name].concat(a.tags)
          : a.tags),
        (this._states.tags[a.name] = c.grep(
          this._states.tags[a.name],
          c.proxy(function (b, d) {
            return c.inArray(b, this._states.tags[a.name]) === d;
          }, this)
        )));
  };
  d.prototype.suppress = function (a) {
    c.each(
      a,
      c.proxy(function (a, c) {
        this._supress[c] = !0;
      }, this)
    );
  };
  d.prototype.release = function (a) {
    c.each(
      a,
      c.proxy(function (a, c) {
        delete this._supress[c];
      }, this)
    );
  };
  d.prototype.pointer = function (a) {
    var b = { x: null, y: null };
    a = a.originalEvent || a || f.event;
    a =
      a.touches && a.touches.length
        ? a.touches[0]
        : a.changedTouches && a.changedTouches.length
        ? a.changedTouches[0]
        : a;
    a.pageX
      ? ((b.x = a.pageX), (b.y = a.pageY))
      : ((b.x = a.clientX), (b.y = a.clientY));
    return b;
  };
  d.prototype.isNumeric = function (a) {
    return !isNaN(parseFloat(a));
  };
  d.prototype.difference = function (a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
  };
  c.fn.owlCarousel = function (a) {
    var b = Array.prototype.slice.call(arguments, 1);
    return this.each(function () {
      var e = c(this),
        m = e.data("owl.carousel");
      m ||
        ((m = new d(this, "object" == typeof a && a)),
        e.data("owl.carousel", m),
        c.each(
          "next prev to destroy refresh replace add remove".split(" "),
          function (a, b) {
            m.register({ type: d.Type.Event, name: b });
            m.$element.on(
              b + ".owl.carousel.core",
              c.proxy(function (a) {
                a.namespace &&
                  a.relatedTarget !== this &&
                  (this.suppress([b]),
                  m[b].apply(this, [].slice.call(arguments, 1)),
                  this.release([b]));
              }, m)
            );
          }
        ));
      "string" == typeof a && "_" !== a.charAt(0) && m[a].apply(m, b);
    });
  };
  c.fn.owlCarousel.Constructor = d;
})(window.Zepto || window.jQuery, window, document);
(function (c, f, l, k) {
  var d = function (a) {
    this._core = a;
    this._visible = this._interval = null;
    this._handlers = {
      "initialized.owl.carousel": c.proxy(function (a) {
        a.namespace && this._core.settings.autoRefresh && this.watch();
      }, this),
    };
    this._core.options = c.extend({}, d.Defaults, this._core.options);
    this._core.$element.on(this._handlers);
  };
  d.Defaults = { autoRefresh: !0, autoRefreshInterval: 500 };
  d.prototype.watch = function () {
    this._interval ||
      ((this._visible = this._core.$element.is(":visible")),
      (this._interval = f.setInterval(
        c.proxy(this.refresh, this),
        this._core.settings.autoRefreshInterval
      )));
  };
  d.prototype.refresh = function () {
    this._core.$element.is(":visible") !== this._visible &&
      ((this._visible = !this._visible),
      this._core.$element.toggleClass("owl-hidden", !this._visible),
      this._visible && this._core.invalidate("width") && this._core.refresh());
  };
  d.prototype.destroy = function () {
    var a, b;
    f.clearInterval(this._interval);
    for (a in this._handlers) this._core.$element.off(a, this._handlers[a]);
    for (b in Object.getOwnPropertyNames(this))
      "function" != typeof this[b] && (this[b] = null);
  };
  c.fn.owlCarousel.Constructor.Plugins.AutoRefresh = d;
})(window.Zepto || window.jQuery, window, document);
(function (c, f, l, k) {
  var d = function (a) {
    this._core = a;
    this._loaded = [];
    this._handlers = {
      "initialized.owl.carousel change.owl.carousel resized.owl.carousel":
        c.proxy(function (a) {
          if (
            a.namespace &&
            this._core.settings &&
            this._core.settings.lazyLoad &&
            ((a.property && "position" == a.property.name) ||
              "initialized" == a.type)
          ) {
            var b = this._core.settings,
              d = (b.center && Math.ceil(b.items / 2)) || b.items;
            b = (b.center && -1 * d) || 0;
            a =
              (a.property && a.property.value !== k
                ? a.property.value
                : this._core.current()) + b;
            for (
              var h = this._core.clones().length,
                g = c.proxy(function (a, b) {
                  this.load(b);
                }, this);
              b++ < d;

            )
              this.load(h / 2 + this._core.relative(a)),
                h && c.each(this._core.clones(this._core.relative(a)), g),
                a++;
          }
        }, this),
    };
    this._core.options = c.extend({}, d.Defaults, this._core.options);
    this._core.$element.on(this._handlers);
  };
  d.Defaults = { lazyLoad: !1 };
  d.prototype.load = function (a) {
    var b = (a = this._core.$stage.children().eq(a)) && a.find(".owl-lazy");
    !b ||
      -1 < c.inArray(a.get(0), this._loaded) ||
      (b.each(
        c.proxy(function (a, b) {
          var d = c(b),
            e =
              (1 < f.devicePixelRatio && d.attr("data-src-retina")) ||
              d.attr("data-src");
          this._core.trigger("load", { element: d, url: e }, "lazy");
          d.is("img")
            ? d
                .one(
                  "load.owl.lazy",
                  c.proxy(function () {
                    d.css("opacity", 1);
                    this._core.trigger(
                      "loaded",
                      { element: d, url: e },
                      "lazy"
                    );
                  }, this)
                )
                .attr("src", e)
            : ((a = new Image()),
              (a.onload = c.proxy(function () {
                d.css({ "background-image": "url(" + e + ")", opacity: "1" });
                this._core.trigger("loaded", { element: d, url: e }, "lazy");
              }, this)),
              (a.src = e));
        }, this)
      ),
      this._loaded.push(a.get(0)));
  };
  d.prototype.destroy = function () {
    var a, b;
    for (a in this.handlers) this._core.$element.off(a, this.handlers[a]);
    for (b in Object.getOwnPropertyNames(this))
      "function" != typeof this[b] && (this[b] = null);
  };
  c.fn.owlCarousel.Constructor.Plugins.Lazy = d;
})(window.Zepto || window.jQuery, window, document);
(function (c, f, l, k) {
  var d = function (a) {
    this._core = a;
    this._handlers = {
      "initialized.owl.carousel refreshed.owl.carousel": c.proxy(function (a) {
        a.namespace && this._core.settings.autoHeight && this.update();
      }, this),
      "changed.owl.carousel": c.proxy(function (a) {
        a.namespace &&
          this._core.settings.autoHeight &&
          "position" == a.property.name &&
          this.update();
      }, this),
      "loaded.owl.lazy": c.proxy(function (a) {
        a.namespace &&
          this._core.settings.autoHeight &&
          a.element.closest("." + this._core.settings.itemClass).index() ===
            this._core.current() &&
          this.update();
      }, this),
    };
    this._core.options = c.extend({}, d.Defaults, this._core.options);
    this._core.$element.on(this._handlers);
  };
  d.Defaults = { autoHeight: !1, autoHeightClass: "owl-height" };
  d.prototype.update = function () {
    var a = this._core._current,
      b = a + this._core.settings.items;
    a = this._core.$stage.children().toArray().slice(a, b);
    var d = [];
    b = 0;
    c.each(a, function (a, b) {
      d.push(c(b).height());
    });
    b = Math.max.apply(null, d);
    this._core.$stage
      .parent()
      .height(b)
      .addClass(this._core.settings.autoHeightClass);
  };
  d.prototype.destroy = function () {
    var a, b;
    for (a in this._handlers) this._core.$element.off(a, this._handlers[a]);
    for (b in Object.getOwnPropertyNames(this))
      "function" != typeof this[b] && (this[b] = null);
  };
  c.fn.owlCarousel.Constructor.Plugins.AutoHeight = d;
})(window.Zepto || window.jQuery, window, document);
(function (c, f, l, k) {
  var d = function (a) {
    this._core = a;
    this._videos = {};
    this._playing = null;
    this._handlers = {
      "initialized.owl.carousel": c.proxy(function (a) {
        a.namespace &&
          this._core.register({
            type: "state",
            name: "playing",
            tags: ["interacting"],
          });
      }, this),
      "resize.owl.carousel": c.proxy(function (a) {
        a.namespace &&
          this._core.settings.video &&
          this.isInFullScreen() &&
          a.preventDefault();
      }, this),
      "refreshed.owl.carousel": c.proxy(function (a) {
        a.namespace &&
          this._core.is("resizing") &&
          this._core.$stage.find(".cloned .owl-video-frame").remove();
      }, this),
      "changed.owl.carousel": c.proxy(function (a) {
        a.namespace &&
          "position" === a.property.name &&
          this._playing &&
          this.stop();
      }, this),
      "prepared.owl.carousel": c.proxy(function (a) {
        if (a.namespace) {
          var b = c(a.content).find(".owl-video");
          b.length && (b.css("display", "none"), this.fetch(b, c(a.content)));
        }
      }, this),
    };
    this._core.options = c.extend({}, d.Defaults, this._core.options);
    this._core.$element.on(this._handlers);
    this._core.$element.on(
      "click.owl.video",
      ".owl-video-play-icon",
      c.proxy(function (a) {
        this.play(a);
      }, this)
    );
  };
  d.Defaults = { video: !1, videoHeight: !1, videoWidth: !1 };
  d.prototype.fetch = function (a, b) {
    a.attr("data-vimeo-id") || a.attr("data-vzaar-id");
    a.attr("data-vimeo-id") ||
      a.attr("data-youtube-id") ||
      a.attr("data-vzaar-id");
    var c = a.attr("data-width") || this._core.settings.videoWidth,
      d = a.attr("data-height") || this._core.settings.videoHeight,
      h = a.attr("href");
    if (h) {
      var g = h.match(
        /(http:|https:|)\/\/(player.|www.|app.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com)|vzaar\.com)\/(video\/|videos\/|embed\/|channels\/.+\/|groups\/.+\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(&\S+)?/
      );
      if (-1 < g[3].indexOf("youtu")) var f = "youtube";
      else if (-1 < g[3].indexOf("vimeo")) f = "vimeo";
      else if (-1 < g[3].indexOf("vzaar")) f = "vzaar";
      else throw Error("Video URL not supported.");
      g = g[6];
    } else throw Error("Missing video URL.");
    this._videos[h] = { type: f, id: g, width: c, height: d };
    b.attr("data-video", h);
    this.thumbnail(a, this._videos[h]);
  };
  d.prototype.thumbnail = function (a, b) {
    var d,
      m =
        b.width && b.height
          ? 'style\x3d"width:' + b.width + "px;height:" + b.height + 'px;"'
          : "",
      h = a.find("img"),
      g = "src",
      f = "",
      k = this._core.settings,
      l = function (b) {
        d = k.lazyLoad
          ? '\x3cdiv class\x3d"owl-video-tn ' +
            f +
            '" ' +
            g +
            '\x3d"' +
            b +
            '"\x3e\x3c/div\x3e'
          : '\x3cdiv class\x3d"owl-video-tn" style\x3d"opacity:1;background-image:url(' +
            b +
            ')"\x3e\x3c/div\x3e';
        a.after(d);
        a.after('\x3cdiv class\x3d"owl-video-play-icon"\x3e\x3c/div\x3e');
      };
    a.wrap('\x3cdiv class\x3d"owl-video-wrapper"' + m + "\x3e\x3c/div\x3e");
    this._core.settings.lazyLoad && ((g = "data-src"), (f = "owl-lazy"));
    if (h.length) return l(h.attr(g)), h.remove(), !1;
    if ("youtube" === b.type) {
      var p = "//img.youtube.com/vi/" + b.id + "/hqdefault.jpg";
      l(p);
    } else
      "vimeo" === b.type
        ? c.ajax({
            type: "GET",
            url: "//vimeo.com/api/v2/video/" + b.id + ".json",
            jsonp: "callback",
            dataType: "jsonp",
            success: function (a) {
              p = a[0].thumbnail_large;
              l(p);
            },
          })
        : "vzaar" === b.type &&
          c.ajax({
            type: "GET",
            url: "//vzaar.com/api/videos/" + b.id + ".json",
            jsonp: "callback",
            dataType: "jsonp",
            success: function (a) {
              p = a.framegrab_url;
              l(p);
            },
          });
  };
  d.prototype.stop = function () {
    this._core.trigger("stop", null, "video");
    this._playing.find(".owl-video-frame").remove();
    this._playing.removeClass("owl-video-playing");
    this._playing = null;
    this._core.leave("playing");
    this._core.trigger("stopped", null, "video");
  };
  d.prototype.play = function (a) {
    a = c(a.target).closest("." + this._core.settings.itemClass);
    var b = this._videos[a.attr("data-video")],
      d = b.width || "100%",
      f = b.height || this._core.$stage.height(),
      h;
    this._playing ||
      (this._core.enter("playing"),
      this._core.trigger("play", null, "video"),
      (a = this._core.items(this._core.relative(a.index()))),
      this._core.reset(a.index()),
      "youtube" === b.type
        ? (h =
            '\x3ciframe width\x3d"' +
            d +
            '" height\x3d"' +
            f +
            '" src\x3d"//www.youtube.com/embed/' +
            b.id +
            "?autoplay\x3d1\x26v\x3d" +
            b.id +
            '" frameborder\x3d"0" allowfullscreen\x3e\x3c/iframe\x3e')
        : "vimeo" === b.type
        ? (h =
            '\x3ciframe src\x3d"//player.vimeo.com/video/' +
            b.id +
            '?autoplay\x3d1" width\x3d"' +
            d +
            '" height\x3d"' +
            f +
            '" frameborder\x3d"0" webkitallowfullscreen mozallowfullscreen allowfullscreen\x3e\x3c/iframe\x3e')
        : "vzaar" === b.type &&
          (h =
            '\x3ciframe frameborder\x3d"0"height\x3d"' +
            f +
            '"width\x3d"' +
            d +
            '" allowfullscreen mozallowfullscreen webkitAllowFullScreen src\x3d"//view.vzaar.com/' +
            b.id +
            '/player?autoplay\x3dtrue"\x3e\x3c/iframe\x3e'),
      c(
        '\x3cdiv class\x3d"owl-video-frame"\x3e' + h + "\x3c/div\x3e"
      ).insertAfter(a.find(".owl-video")),
      (this._playing = a.addClass("owl-video-playing")));
  };
  d.prototype.isInFullScreen = function () {
    var a =
      l.fullscreenElement ||
      l.mozFullScreenElement ||
      l.webkitFullscreenElement;
    return a && c(a).parent().hasClass("owl-video-frame");
  };
  d.prototype.destroy = function () {
    var a, b;
    this._core.$element.off("click.owl.video");
    for (a in this._handlers) this._core.$element.off(a, this._handlers[a]);
    for (b in Object.getOwnPropertyNames(this))
      "function" != typeof this[b] && (this[b] = null);
  };
  c.fn.owlCarousel.Constructor.Plugins.Video = d;
})(window.Zepto || window.jQuery, window, document);
(function (c, f, l, k) {
  var d = function (a) {
    this.core = a;
    this.core.options = c.extend({}, d.Defaults, this.core.options);
    this.swapping = !0;
    this.next = this.previous = k;
    this.handlers = {
      "change.owl.carousel": c.proxy(function (a) {
        a.namespace &&
          "position" == a.property.name &&
          ((this.previous = this.core.current()),
          (this.next = a.property.value));
      }, this),
      "drag.owl.carousel dragged.owl.carousel translated.owl.carousel": c.proxy(
        function (a) {
          a.namespace && (this.swapping = "translated" == a.type);
        },
        this
      ),
      "translate.owl.carousel": c.proxy(function (a) {
        a.namespace &&
          this.swapping &&
          (this.core.options.animateOut || this.core.options.animateIn) &&
          this.swap();
      }, this),
    };
    this.core.$element.on(this.handlers);
  };
  d.Defaults = { animateOut: !1, animateIn: !1 };
  d.prototype.swap = function () {
    if (
      1 === this.core.settings.items &&
      c.support.animation &&
      c.support.transition
    ) {
      this.core.speed(0);
      var a = c.proxy(this.clear, this),
        b = this.core.$stage.children().eq(this.previous),
        d = this.core.$stage.children().eq(this.next),
        f = this.core.settings.animateIn,
        h = this.core.settings.animateOut;
      if (this.core.current() !== this.previous) {
        if (h) {
          var g =
            this.core.coordinates(this.previous) -
            this.core.coordinates(this.next);
          b.one(c.support.animation.end, a)
            .css({ left: g + "px" })
            .addClass("animated owl-animated-out")
            .addClass(h);
        }
        f &&
          d
            .one(c.support.animation.end, a)
            .addClass("animated owl-animated-in")
            .addClass(f);
      }
    }
  };
  d.prototype.clear = function (a) {
    c(a.target)
      .css({ left: "" })
      .removeClass("animated owl-animated-out owl-animated-in")
      .removeClass(this.core.settings.animateIn)
      .removeClass(this.core.settings.animateOut);
    this.core.onTransitionEnd();
  };
  d.prototype.destroy = function () {
    var a, b;
    for (a in this.handlers) this.core.$element.off(a, this.handlers[a]);
    for (b in Object.getOwnPropertyNames(this))
      "function" != typeof this[b] && (this[b] = null);
  };
  c.fn.owlCarousel.Constructor.Plugins.Animate = d;
})(window.Zepto || window.jQuery, window, document);
(function (c, f, l, k) {
  var d = function (a) {
    this._core = a;
    this._timeout = null;
    this._paused = !1;
    this._handlers = {
      "changed.owl.carousel": c.proxy(function (a) {
        a.namespace && "settings" === a.property.name
          ? this._core.settings.autoplay
            ? this.play()
            : this.stop()
          : a.namespace &&
            "position" === a.property.name &&
            this._core.settings.autoplay &&
            this._setAutoPlayInterval();
      }, this),
      "initialized.owl.carousel": c.proxy(function (a) {
        a.namespace && this._core.settings.autoplay && this.play();
      }, this),
      "play.owl.autoplay": c.proxy(function (a, c, d) {
        a.namespace && this.play(c, d);
      }, this),
      "stop.owl.autoplay": c.proxy(function (a) {
        a.namespace && this.stop();
      }, this),
      "mouseover.owl.autoplay": c.proxy(function () {
        this._core.settings.autoplayHoverPause &&
          this._core.is("rotating") &&
          this.pause();
      }, this),
      "mouseleave.owl.autoplay": c.proxy(function () {
        this._core.settings.autoplayHoverPause &&
          this._core.is("rotating") &&
          this.play();
      }, this),
      "touchstart.owl.core": c.proxy(function () {
        this._core.settings.autoplayHoverPause &&
          this._core.is("rotating") &&
          this.pause();
      }, this),
      "touchend.owl.core": c.proxy(function () {
        this._core.settings.autoplayHoverPause && this.play();
      }, this),
    };
    this._core.$element.on(this._handlers);
    this._core.options = c.extend({}, d.Defaults, this._core.options);
  };
  d.Defaults = {
    autoplay: !1,
    autoplayTimeout: 5e3,
    autoplayHoverPause: !1,
    autoplaySpeed: !1,
  };
  d.prototype.play = function (a, b) {
    this._paused = !1;
    this._core.is("rotating") ||
      (this._core.enter("rotating"), this._setAutoPlayInterval());
  };
  d.prototype._getNextTimeout = function (a, b) {
    this._timeout && f.clearTimeout(this._timeout);
    return f.setTimeout(
      c.proxy(function () {
        this._paused ||
          this._core.is("busy") ||
          this._core.is("interacting") ||
          l.hidden ||
          this._core.next(b || this._core.settings.autoplaySpeed);
      }, this),
      a || this._core.settings.autoplayTimeout
    );
  };
  d.prototype._setAutoPlayInterval = function () {
    this._timeout = this._getNextTimeout();
  };
  d.prototype.stop = function () {
    this._core.is("rotating") &&
      (f.clearTimeout(this._timeout), this._core.leave("rotating"));
  };
  d.prototype.pause = function () {
    this._core.is("rotating") && (this._paused = !0);
  };
  d.prototype.destroy = function () {
    var a, b;
    this.stop();
    for (a in this._handlers) this._core.$element.off(a, this._handlers[a]);
    for (b in Object.getOwnPropertyNames(this))
      "function" != typeof this[b] && (this[b] = null);
  };
  c.fn.owlCarousel.Constructor.Plugins.autoplay = d;
})(window.Zepto || window.jQuery, window, document);
(function (c, f, l, k) {
  var d = function (a) {
    this._core = a;
    this._initialized = !1;
    this._pages = [];
    this._controls = {};
    this._templates = [];
    this.$element = this._core.$element;
    this._overrides = {
      next: this._core.next,
      prev: this._core.prev,
      to: this._core.to,
    };
    this._handlers = {
      "prepared.owl.carousel": c.proxy(function (a) {
        a.namespace &&
          this._core.settings.dotsData &&
          this._templates.push(
            '\x3cdiv class\x3d"' +
              this._core.settings.dotClass +
              '"\x3e' +
              c(a.content)
                .find("[data-dot]")
                .addBack("[data-dot]")
                .attr("data-dot") +
              "\x3c/div\x3e"
          );
      }, this),
      "added.owl.carousel": c.proxy(function (a) {
        a.namespace &&
          this._core.settings.dotsData &&
          this._templates.splice(a.position, 0, this._templates.pop());
      }, this),
      "remove.owl.carousel": c.proxy(function (a) {
        a.namespace &&
          this._core.settings.dotsData &&
          this._templates.splice(a.position, 1);
      }, this),
      "changed.owl.carousel": c.proxy(function (a) {
        a.namespace && "position" == a.property.name && this.draw();
      }, this),
      "initialized.owl.carousel": c.proxy(function (a) {
        a.namespace &&
          !this._initialized &&
          (this._core.trigger("initialize", null, "navigation"),
          this.initialize(),
          this.update(),
          this.draw(),
          (this._initialized = !0),
          this._core.trigger("initialized", null, "navigation"));
      }, this),
      "refreshed.owl.carousel": c.proxy(function (a) {
        a.namespace &&
          this._initialized &&
          (this._core.trigger("refresh", null, "navigation"),
          this.update(),
          this.draw(),
          this._core.trigger("refreshed", null, "navigation"));
      }, this),
    };
    this._core.options = c.extend({}, d.Defaults, this._core.options);
    this.$element.on(this._handlers);
  };
  d.Defaults = {
    nav: !1,
    navText: ["prev", "next"],
    navSpeed: !1,
    navElement: "div",
    navContainer: !1,
    navContainerClass: "owl-nav",
    navClass: ["owl-prev", "owl-next"],
    slideBy: 1,
    dotClass: "owl-dot",
    dotsClass: "owl-dots",
    dots: !0,
    dotsEach: !1,
    dotsData: !1,
    dotsSpeed: !1,
    dotsContainer: !1,
  };
  d.prototype.initialize = function () {
    var a,
      b = this._core.settings;
    this._controls.$relative = (
      b.navContainer
        ? c(b.navContainer)
        : c("\x3cdiv\x3e").addClass(b.navContainerClass).appendTo(this.$element)
    ).addClass("disabled");
    this._controls.$previous = c("\x3c" + b.navElement + "\x3e")
      .addClass(b.navClass[0])
      .html(b.navText[0])
      .prependTo(this._controls.$relative)
      .on(
        "click",
        c.proxy(function (a) {
          this.prev(b.navSpeed);
        }, this)
      );
    this._controls.$next = c("\x3c" + b.navElement + "\x3e")
      .addClass(b.navClass[1])
      .html(b.navText[1])
      .appendTo(this._controls.$relative)
      .on(
        "click",
        c.proxy(function (a) {
          this.next(b.navSpeed);
        }, this)
      );
    b.dotsData ||
      (this._templates = [
        c("\x3cdiv\x3e")
          .addClass(b.dotClass)
          .append(c("\x3cspan\x3e"))
          .prop("outerHTML"),
      ]);
    this._controls.$absolute = (
      b.dotsContainer
        ? c(b.dotsContainer)
        : c("\x3cdiv\x3e").addClass(b.dotsClass).appendTo(this.$element)
    ).addClass("disabled");
    this._controls.$absolute.on(
      "click",
      "div",
      c.proxy(function (a) {
        var d = c(a.target).parent().is(this._controls.$absolute)
          ? c(a.target).index()
          : c(a.target).parent().index();
        a.preventDefault();
        this.to(d, b.dotsSpeed);
      }, this)
    );
    for (a in this._overrides) this._core[a] = c.proxy(this[a], this);
  };
  d.prototype.destroy = function () {
    var a, b, c, d;
    for (a in this._handlers) this.$element.off(a, this._handlers[a]);
    for (b in this._controls) this._controls[b].remove();
    for (d in this.overides) this._core[d] = this._overrides[d];
    for (c in Object.getOwnPropertyNames(this))
      "function" != typeof this[c] && (this[c] = null);
  };
  d.prototype.update = function () {
    var a,
      b,
      c = this._core.clones().length / 2,
      d = c + this._core.items().length,
      f = this._core.maximum(!0);
    var g = this._core.settings;
    var k = g.center || g.autoWidth || g.dotsData ? 1 : g.dotsEach || g.items;
    "page" !== g.slideBy && (g.slideBy = Math.min(g.slideBy, g.items));
    if (g.dots || "page" == g.slideBy)
      for (this._pages = [], g = c, b = a = 0; g < d; g++) {
        if (a >= k || 0 === a) {
          this._pages.push({ start: Math.min(f, g - c), end: g - c + k - 1 });
          if (Math.min(f, g - c) === f) break;
          a = 0;
          ++b;
        }
        a += this._core.mergers(this._core.relative(g));
      }
  };
  d.prototype.draw = function () {
    var a = this._core.settings;
    var b = this._core.items().length <= a.items;
    var d = this._core.relative(this._core.current()),
      f = a.loop || a.rewind;
    this._controls.$relative.toggleClass("disabled", !a.nav || b);
    a.nav &&
      (this._controls.$previous.toggleClass(
        "disabled",
        !f && d <= this._core.minimum(!0)
      ),
      this._controls.$next.toggleClass(
        "disabled",
        !f && d >= this._core.maximum(!0)
      ));
    this._controls.$absolute.toggleClass("disabled", !a.dots || b);
    a.dots &&
      ((b = this._pages.length - this._controls.$absolute.children().length),
      a.dotsData && 0 !== b
        ? this._controls.$absolute.html(this._templates.join(""))
        : 0 < b
        ? this._controls.$absolute.append(Array(b + 1).join(this._templates[0]))
        : 0 > b && this._controls.$absolute.children().slice(b).remove(),
      this._controls.$absolute.find(".active").removeClass("active"),
      this._controls.$absolute
        .children()
        .eq(c.inArray(this.current(), this._pages))
        .addClass("active"));
  };
  d.prototype.onTrigger = function (a) {
    var b = this._core.settings;
    a.page = {
      index: c.inArray(this.current(), this._pages),
      count: this._pages.length,
      size:
        b &&
        (b.center || b.autoWidth || b.dotsData ? 1 : b.dotsEach || b.items),
    };
  };
  d.prototype.current = function () {
    var a = this._core.relative(this._core.current());
    return c
      .grep(
        this._pages,
        c.proxy(function (b, c) {
          return b.start <= a && b.end >= a;
        }, this)
      )
      .pop();
  };
  d.prototype.getPosition = function (a) {
    var b = this._core.settings;
    if ("page" == b.slideBy) {
      var d = c.inArray(this.current(), this._pages);
      b = this._pages.length;
      a ? ++d : --d;
      d = this._pages[((d % b) + b) % b].start;
    } else
      (d = this._core.relative(this._core.current())),
        this._core.items(),
        a ? (d += b.slideBy) : (d -= b.slideBy);
    return d;
  };
  d.prototype.next = function (a) {
    c.proxy(this._overrides.to, this._core)(this.getPosition(!0), a);
  };
  d.prototype.prev = function (a) {
    c.proxy(this._overrides.to, this._core)(this.getPosition(!1), a);
  };
  d.prototype.to = function (a, b, d) {
    !d && this._pages.length
      ? ((d = this._pages.length),
        c.proxy(this._overrides.to, this._core)(
          this._pages[((a % d) + d) % d].start,
          b
        ))
      : c.proxy(this._overrides.to, this._core)(a, b);
  };
  c.fn.owlCarousel.Constructor.Plugins.Navigation = d;
})(window.Zepto || window.jQuery, window, document);
(function (c, f, l, k) {
  var d = function (a) {
    this._core = a;
    this._hashes = {};
    this.$element = this._core.$element;
    this._handlers = {
      "initialized.owl.carousel": c.proxy(function (a) {
        a.namespace &&
          "URLHash" === this._core.settings.startPosition &&
          c(f).trigger("hashchange.owl.navigation");
      }, this),
      "prepared.owl.carousel": c.proxy(function (a) {
        if (a.namespace) {
          var b = c(a.content)
            .find("[data-hash]")
            .addBack("[data-hash]")
            .attr("data-hash");
          b && (this._hashes[b] = a.content);
        }
      }, this),
      "changed.owl.carousel": c.proxy(function (a) {
        if (a.namespace && "position" === a.property.name) {
          var b = this._core.items(this._core.relative(this._core.current()));
          (a = c
            .map(this._hashes, function (a, c) {
              return a === b ? c : null;
            })
            .join()) &&
            f.location.hash.slice(1) !== a &&
            (f.location.hash = a);
        }
      }, this),
    };
    this._core.options = c.extend({}, d.Defaults, this._core.options);
    this.$element.on(this._handlers);
    c(f).on(
      "hashchange.owl.navigation",
      c.proxy(function (a) {
        a = f.location.hash.substring(1);
        var b = this._core.$stage.children();
        a = this._hashes[a] && b.index(this._hashes[a]);
        a !== k &&
          a !== this._core.current() &&
          this._core.to(this._core.relative(a), !1, !0);
      }, this)
    );
  };
  d.Defaults = { URLhashListener: !1 };
  d.prototype.destroy = function () {
    var a, b;
    c(f).off("hashchange.owl.navigation");
    for (a in this._handlers) this._core.$element.off(a, this._handlers[a]);
    for (b in Object.getOwnPropertyNames(this))
      "function" != typeof this[b] && (this[b] = null);
  };
  c.fn.owlCarousel.Constructor.Plugins.Hash = d;
})(window.Zepto || window.jQuery, window, document);
(function (c, f, l, k) {
  function d(d, e) {
    var f = !1,
      h = d.charAt(0).toUpperCase() + d.slice(1);
    c.each((d + " " + b.join(h + " ") + h).split(" "), function (b, c) {
      if (a[c] !== k) return (f = e ? c : !0), !1;
    });
    return f;
  }
  var a = c("\x3csupport\x3e").get(0).style,
    b = ["Webkit", "Moz", "O", "ms"];
  f = {
    WebkitTransition: "webkitTransitionEnd",
    MozTransition: "transitionend",
    OTransition: "oTransitionEnd",
    transition: "transitionend",
  };
  l = {
    WebkitAnimation: "webkitAnimationEnd",
    MozAnimation: "animationend",
    OAnimation: "oAnimationEnd",
    animation: "animationend",
  };
  var e = {
    csstransforms: function () {
      return !!d("transform");
    },
    csstransforms3d: function () {
      return !!d("perspective");
    },
    csstransitions: function () {
      return !!d("transition");
    },
    cssanimations: function () {
      return !!d("animation");
    },
  };
  e.csstransitions() &&
    ((c.support.transition = new String(d("transition", !0))),
    (c.support.transition.end = f[c.support.transition]));
  e.cssanimations() &&
    ((c.support.animation = new String(d("animation", !0))),
    (c.support.animation.end = l[c.support.animation]));
  e.csstransforms() &&
    ((c.support.transform = new String(d("transform", !0))),
    (c.support.transform3d = e.csstransforms3d()));
})(window.Zepto || window.jQuery, window, document);
function digitRenewals() {
  -1 === window.location.href.indexOf("/content/godigit/directportal/en")
    ? (location.href = window.location.origin + "/login")
    : (location.href =
        window.location.origin + "/content/godigit/directportal/en/login.html");
}
$("#banner-slider-container").owlCarousel({
  loop: !1,
  margin: 10,
  dots: !1,
  center: !0,
  responsive: { 320: { items: 1.2 } },
});
$("html,body").on("click", "#home-insurance-mob-quote", function () {
  $("#get-quote-list-mobile").append(
    '\x3cli style\x3d"height: 450px;"\x3e\x3c/li\x3e'
  );
  $("#get-quote-list-mobile")
    .find("li:first-child")
    .find("div.collapse")
    .css("display", "block");
  $("#pincode-mob-view").focus();
  void 0 !== apna_complex_details.pincode &&
    ($("#pincode-mob-view").val(apna_complex_details.pincode),
    validatePincode(apna_complex_details.pincode));
  var c = setInterval(function () {
    $("#quote-entry-modal-home-insurance").hasClass("in") &&
      "" !== $("#pincode-mob-view").val() &&
      ($("#pincode-mob-view").keyup(), clearInterval(c));
  }, 1e3);
});
