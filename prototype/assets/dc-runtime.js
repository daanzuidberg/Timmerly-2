/*
 * Mini-runtime voor de Claude Design templatetaal (`.dc.html`).
 *
 * De ontwerpbron gebruikt een kleine DSL: `{{ expressie }}` in tekst en
 * attributen, `<sc-if value="{{ ... }}">` en `<sc-for list="{{ ... }}" as="x">`.
 * In Claude Design wordt die door support.js naar React gerenderd. Hier draaien
 * we hem zonder build en zonder framework, zodat het prototype gewoon als
 * statische site te hosten is.
 *
 * Ondersteund: interpolatie in tekst en attributen, sc-if, sc-for, onClick,
 * onChange en value-binding op input/textarea.
 */
(function (global) {
  'use strict';

  // ── Expressies ────────────────────────────────────────────────────────────
  // De DSL kent alleen paden (`a.b.c`) en literals; geen operatoren.
  function evalExpr(expr, scope) {
    var src = String(expr).trim();
    if (src === '') return '';
    if (src === 'true') return true;
    if (src === 'false') return false;
    if (src === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(src)) return Number(src);
    if (/^'.*'$/.test(src) || /^".*"$/.test(src)) return src.slice(1, -1);

    var parts = src.split('.');
    var val = scope;
    for (var i = 0; i < parts.length; i++) {
      if (val === null || val === undefined) return undefined;
      val = val[parts[i].trim()];
    }
    return val;
  }

  var TOKEN = /\{\{([\s\S]*?)\}\}/g;

  function hasToken(str) {
    return str.indexOf('{{') !== -1;
  }

  // Eén enkele token zonder omringende tekst levert de ruwe waarde op (functie,
  // array, boolean); gemengde tekst levert altijd een string.
  function evalAttr(str, scope) {
    var whole = /^\s*\{\{([\s\S]*)\}\}\s*$/.exec(str);
    if (whole) return evalExpr(whole[1], scope);
    return interpolate(str, scope);
  }

  function interpolate(str, scope) {
    return str.replace(TOKEN, function (_, expr) {
      var v = evalExpr(expr, scope);
      return v === null || v === undefined || v === false ? '' : String(v);
    });
  }

  // ── Rendering ─────────────────────────────────────────────────────────────
  var SKIP_TAGS = { HELMET: 1, 'DC-IMPORT': 1 };
  var VALUE_TAGS = { INPUT: 1, TEXTAREA: 1, SELECT: 1 };

  function isHint(name) {
    return name.indexOf('hint-') === 0;
  }

  function renderNodes(source, target, scope, key) {
    var nodes = source.childNodes;
    for (var i = 0; i < nodes.length; i++) {
      renderNode(nodes[i], target, scope, key + '.' + i);
    }
  }

  function renderNode(node, target, scope, key) {
    if (node.nodeType === 3) {
      var text = node.nodeValue;
      target.appendChild(document.createTextNode(hasToken(text) ? interpolate(text, scope) : text));
      return;
    }
    if (node.nodeType !== 1) return;

    var tag = node.tagName.toUpperCase();
    if (SKIP_TAGS[tag]) return;

    if (tag === 'SC-IF') {
      if (evalAttr(node.getAttribute('value'), scope)) {
        renderNodes(node, target, scope, key);
      }
      return;
    }

    if (tag === 'SC-FOR') {
      var list = evalAttr(node.getAttribute('list'), scope) || [];
      var as = node.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) {
        var childScope = Object.create(scope);
        childScope[as] = list[i];
        childScope[as + 'Index'] = i;
        renderNodes(node, target, childScope, key + '#' + i);
      }
      return;
    }

    var el = node.namespaceURI === 'http://www.w3.org/2000/svg'
      ? document.createElementNS(node.namespaceURI, node.tagName)
      : document.createElement(node.tagName);

    for (var a = 0; a < node.attributes.length; a++) {
      applyAttribute(el, node.attributes[a], scope);
    }
    if (VALUE_TAGS[tag]) el.setAttribute('data-dc-key', key);

    renderNodes(node, el, scope, key);
    target.appendChild(el);
  }

  function applyAttribute(el, attr, scope) {
    var name = attr.name;
    var raw = attr.value;
    if (isHint(name) || name === 'style-hover') return;

    // Event-attributen nooit als attribuut kopiëren: de browser zou `{{ ... }}`
    // als inline JavaScript proberen te compileren.
    if (name.slice(0, 2) === 'on') {
      var handler = evalAttr(raw, scope);
      if (typeof handler !== 'function') return;
      var type = name.slice(2).toLowerCase();
      if (type === 'change') type = 'input'; // React-semantiek: per toetsaanslag
      el.addEventListener(type, handler);
      return;
    }

    if (!hasToken(raw)) {
      el.setAttribute(name, raw);
      return;
    }

    var value = evalAttr(raw, scope);
    if (name === 'value' && VALUE_TAGS[el.tagName.toUpperCase()]) {
      el.value = value === null || value === undefined ? '' : String(value);
      return;
    }
    if (value === null || value === undefined || value === false) return;
    el.setAttribute(name, value === true ? '' : String(value));
  }

  // ── Focusbehoud ───────────────────────────────────────────────────────────
  // We hertekenen bij elke setState volledig. Zonder deze stap verliest een
  // tekstveld de focus (en de cursorpositie) bij elke aanslag.
  function captureFocus(mount) {
    var el = document.activeElement;
    if (!el || !mount.contains(el) || !el.hasAttribute('data-dc-key')) return null;
    return {
      key: el.getAttribute('data-dc-key'),
      start: el.selectionStart,
      end: el.selectionEnd
    };
  }

  function restoreFocus(mount, snapshot) {
    if (!snapshot) return;
    var el = mount.querySelector('[data-dc-key="' + snapshot.key + '"]');
    if (!el) return;
    el.focus();
    if (snapshot.start !== null && snapshot.start !== undefined && el.setSelectionRange) {
      try { el.setSelectionRange(snapshot.start, snapshot.end); } catch (e) { /* type zonder selectie */ }
    }
  }

  // ── Logica-basisklasse ────────────────────────────────────────────────────
  // Zelfde oppervlak als DCLogic in Claude Design, zodat de logica uit de
  // ontwerpbron ongewijzigd overgenomen kan worden.
  function DCLogic() {}
  DCLogic.prototype.setState = function (patch) {
    this.state = Object.assign({}, this.state, patch);
    if (this._onUpdate) this._onUpdate();
  };

  function mount(options) {
    var template = document.querySelector(options.template);
    var target = document.querySelector(options.mount);
    var component = new options.component();
    component.props = options.props || {};

    var scheduled = false;
    function draw() {
      var focus = captureFocus(target);
      var values = component.renderVals();
      var fragment = document.createDocumentFragment();
      renderNodes(template.content, fragment, values, 'r');
      target.textContent = '';
      target.appendChild(fragment);
      restoreFocus(target, focus);
    }

    // Meerdere setState-aanroepen in één handler leiden tot één hertekening.
    component._onUpdate = function () {
      if (scheduled) return;
      scheduled = true;
      Promise.resolve().then(function () {
        scheduled = false;
        draw();
      });
    };

    draw();
    return component;
  }

  global.DC = { mount: mount, evalExpr: evalExpr };
  global.DCLogic = DCLogic;
})(window);
