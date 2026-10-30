// Robust React-compatible Component Runtime, Virtual DOM & Lexer Engine
// Enterprise Bot AI Agent Builder

(function (global) {
  // Void elements that do not require closing tags
  const VOID_ELEMENTS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  // SVG namespace elements
  const SVG_ELEMENTS = new Set([
    'svg', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline',
    'ellipse', 'g', 'defs', 'clipPath', 'mask', 'text', 'use'
  ]);

  function decodeEntities(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  // --- Virtual DOM Node Creation (h / createElement) ---
  function h(type, props, ...children) {
    props = props || {};
    const flat = [];
    function flatten(items) {
      if (!items) return;
      if (Array.isArray(items)) {
        for (let i = 0; i < items.length; i++) flatten(items[i]);
      } else if (items !== null && items !== undefined && items !== false) {
        flat.push(items);
      }
    }
    flatten(children);
    return { type, props, children: flat };
  }

  // --- Tagged Template Lexer / Parser (html`...`) ---
  // Pure JavaScript tokenizer that avoids document.createElement('template').innerHTML
  // Ensures table elements, event handlers, and quoted class interpolations are preserved 100%.
  function html(statics, ...fields) {
    let mode = 'TEXT'; // TEXT | TAG | ATTR_NAME | ATTR_VAL | COMMENT
    let quote = '';
    let buffer = '';
    let currentAttr = '';
    let currentProps = {};
    let currentChildren = [];
    const stack = [];

    function pushChild(child) {
      if (child === null || child === undefined || child === false || child === '') return;
      currentChildren.push(child);
    }

    function flushText() {
      if (buffer) {
        const decoded = decodeEntities(buffer);
        // Ignore lines that are purely whitespace with newlines
        if (/^\s*\n\s*$/.test(decoded)) {
          // ignore newline padding
        } else {
          // Strip leading/trailing newline indentations around elements
          const trimmed = decoded.replace(/^\n\s*/, '').replace(/\n\s*$/, '');
          if (trimmed) {
            pushChild(trimmed);
          }
        }
        buffer = '';
      }
    }

    function openTag(tag) {
      const isVoid = VOID_ELEMENTS.has(tag.toLowerCase());
      stack.push([tag, currentProps, currentChildren, isVoid]);
      currentProps = {};
      currentChildren = [];
    }

    function closeTag(tag) {
      if (stack.length === 0) return;
      const [savedTag, props, children, isVoid] = stack.pop();
      const node = h(savedTag, currentProps, ...currentChildren);
      currentProps = props;
      currentChildren = children;
      pushChild(node);
    }

    for (let i = 0; i < statics.length; i++) {
      const str = statics[i];

      for (let j = 0; j < str.length; j++) {
        const char = str[j];

        if (mode === 'TEXT') {
          if (char === '<') {
            // Check for HTML comment <!--
            if (str.substr(j, 4) === '<!--') {
              flushText();
              mode = 'COMMENT';
              j += 3;
              continue;
            }
            flushText();
            buffer = '';
            mode = 'TAG';
          } else {
            buffer += char;
          }
        } else if (mode === 'COMMENT') {
          if (char === '-' && str.substr(j, 3) === '-->') {
            j += 2;
            mode = 'TEXT';
          }
        } else if (mode === 'TAG') {
          if (char === '/') {
            if (buffer.trim() === '') {
              // Closing tag: </tag>
              const endIdx = str.indexOf('>', j);
              if (endIdx !== -1) {
                const closeTagName = str.substring(j + 1, endIdx).trim();
                closeTag(closeTagName);
                j = endIdx;
                mode = 'TEXT';
                buffer = '';
                continue;
              }
            } else {
              // Self-closing: <tag />
              const tag = buffer.trim();
              openTag(tag);
              closeTag(tag);
              buffer = '';
              mode = 'TAG_SELF_CLOSE';
            }
          } else if (char === '>') {
            if (buffer.trim()) {
              const tag = buffer.trim();
              const isVoid = VOID_ELEMENTS.has(tag.toLowerCase());
              openTag(tag);
              if (isVoid) {
                closeTag(tag);
              }
            }
            buffer = '';
            mode = 'TEXT';
          } else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
            if (buffer.trim()) {
              const tag = buffer.trim();
              openTag(tag);
              buffer = '';
              mode = 'ATTR_NAME';
            }
          } else {
            buffer += char;
          }
        } else if (mode === 'TAG_SELF_CLOSE') {
          if (char === '>') {
            mode = 'TEXT';
            buffer = '';
          }
        } else if (mode === 'ATTR_NAME') {
          if (char === '/') {
            // Self closing indicator: <input ... />
          } else if (char === '>') {
            if (buffer.trim()) {
              currentProps[buffer.trim()] = true;
            }
            buffer = '';
            // If void element, close it immediately
            if (stack.length > 0 && stack[stack.length - 1][3]) {
              closeTag();
            }
            mode = 'TEXT';
          } else if (char === '=') {
            currentAttr = buffer.trim();
            buffer = '';
            mode = 'ATTR_VAL';
            quote = '';
          } else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
            if (buffer.trim()) {
              currentProps[buffer.trim()] = true;
              buffer = '';
            }
          } else {
            buffer += char;
          }
        } else if (mode === 'ATTR_VAL') {
          if (!quote) {
            if (char === '"' || char === "'") {
              quote = char;
            } else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
              if (buffer) {
                currentProps[currentAttr] = buffer;
                buffer = '';
                mode = 'ATTR_NAME';
              }
            } else if (char === '>') {
              if (buffer) {
                currentProps[currentAttr] = buffer;
              }
              buffer = '';
              if (stack.length > 0 && stack[stack.length - 1][3]) {
                closeTag();
              }
              mode = 'TEXT';
            } else if (char === '/') {
              // self closing
            } else {
              buffer += char;
            }
          } else {
            if (char === quote) {
              currentProps[currentAttr] = buffer;
              buffer = '';
              quote = '';
              mode = 'ATTR_NAME';
            } else {
              buffer += char;
            }
          }
        }
      }

      // Handle interpolated field
      if (i < fields.length) {
        const field = fields[i];
        if (mode === 'TEXT') {
          flushText();
          pushChild(field);
        } else if (mode === 'ATTR_VAL') {
          if (quote) {
            // Attribute interpolation inside quotes: class="btn ${active ? 'active' : ''}"
            buffer += (field !== null && field !== undefined ? String(field) : '');
          } else {
            // Direct attribute value without quotes: onClick=${fn} or checked=${bool}
            currentProps[currentAttr] = field;
            mode = 'ATTR_NAME';
          }
        } else if (mode === 'TAG') {
          openTag(field);
          mode = 'ATTR_NAME';
        }
      }
    }

    flushText();
    while (stack.length > 0) {
      closeTag();
    }

    return currentChildren.length === 1 ? currentChildren[0] : currentChildren;
  }

  // --- React Component State Lifecycle & Hooks ---
  const componentHookStores = new Map();
  let currentComponentKey = 'app';
  let currentComponent = null;
  let hookIndex = 0;

  function getComponentStore(key) {
    if (!componentHookStores.has(key)) {
      componentHookStores.set(key, { hooks: [], effects: [] });
    }
    return componentHookStores.get(key);
  }

  function setHookContext(key) {
    currentComponentKey = key || 'app';
    currentComponent = getComponentStore(currentComponentKey);
    hookIndex = 0;
  }

  function useState(initial) {
    if (!currentComponent) {
      setHookContext('app');
    }
    const comp = currentComponent;
    const idx = hookIndex++;
    if (comp.hooks[idx] === undefined) {
      comp.hooks[idx] = typeof initial === 'function' ? initial() : initial;
    }
    const setState = function (nextVal) {
      const newVal = typeof nextVal === 'function' ? nextVal(comp.hooks[idx]) : nextVal;
      if (!Object.is(comp.hooks[idx], newVal)) {
        comp.hooks[idx] = newVal;
        scheduleRender();
      }
    };
    return [comp.hooks[idx], setState];
  }

  function useEffect(callback, deps) {
    if (!currentComponent) {
      setHookContext('app');
    }
    const comp = currentComponent;
    const idx = hookIndex++;
    const prev = comp.hooks[idx];
    let hasChanged = true;
    if (prev && deps) {
      hasChanged = deps.some((dep, i) => !Object.is(dep, prev.deps[i]));
    }
    if (hasChanged) {
      comp.effects.push({ callback, cleanup: prev ? prev.cleanup : null, deps });
    }
    comp.hooks[idx] = { deps, cleanup: prev ? prev.cleanup : null };
  }

  function useRef(initial) {
    if (!currentComponent) {
      setHookContext('app');
    }
    const comp = currentComponent;
    const idx = hookIndex++;
    if (!comp.hooks[idx]) {
      comp.hooks[idx] = { current: initial };
    }
    return comp.hooks[idx];
  }

  // --- DOM Diffing & Rendering ---
  let rootContainer = null;
  let rootComponentFn = null;
  let isRenderPending = false;

  function scheduleRender() {
    if (isRenderPending) return;
    isRenderPending = true;
    requestAnimationFrame(() => {
      isRenderPending = false;
      renderApp();
    });
  }

  function renderApp() {
    if (!rootContainer || !rootComponentFn) return;
    setHookContext('app');

    const vdom = rootComponentFn();
    currentComponent = null;

    // Render into root container
    rootContainer.innerHTML = '';
    if (Array.isArray(vdom)) {
      for (let item of vdom) {
        if (item) rootContainer.appendChild(createDomNode(item));
      }
    } else if (vdom) {
      rootContainer.appendChild(createDomNode(vdom));
    }

    // Run effects across all stores
    for (let store of componentHookStores.values()) {
      for (let eff of store.effects) {
        if (typeof eff.cleanup === 'function') {
          try { eff.cleanup(); } catch (e) { console.error(e); }
        }
        try {
          const clean = eff.callback();
          if (typeof clean === 'function') eff.cleanup = clean;
        } catch (e) {
          console.error(e);
        }
      }
      store.effects = [];
    }
  }

  function setAttribute(el, key, val, isSvg) {
    // Normalization
    if (key === 'className' || key === 'class') {
      const cls = Array.isArray(val) ? val.filter(Boolean).join(' ') : String(val || '');
      el.setAttribute('class', cls);
      if (!isSvg) el.className = cls;
      return;
    }
    if (key === 'htmlFor' || key === 'for') {
      el.setAttribute('for', String(val));
      return;
    }

    // Event handlers (use direct property assignment to avoid duplicate invocations)
    if (key.startsWith('on') && typeof val === 'function') {
      el[key.toLowerCase()] = val;
      return;
    }

    // Direct property bindings
    if (key === 'value') {
      el.value = val === null || val === undefined ? '' : String(val);
      el.setAttribute('value', String(val));
      return;
    }
    if (key === 'checked') {
      el.checked = Boolean(val);
      if (val) el.setAttribute('checked', '');
      else el.removeAttribute('checked');
      return;
    }
    if (key === 'disabled') {
      el.disabled = Boolean(val);
      if (val) el.setAttribute('disabled', '');
      else el.removeAttribute('disabled');
      return;
    }
    if (key === 'selected') {
      el.selected = Boolean(val);
      if (val) el.setAttribute('selected', '');
      else el.removeAttribute('selected');
      return;
    }

    // Inline styles
    if (key === 'style') {
      if (typeof val === 'string') {
        el.style.cssText = val;
      } else if (typeof val === 'object' && val !== null) {
        Object.assign(el.style, val);
      }
      return;
    }

    // DangerouslySetInnerHTML
    if (key === 'dangerouslySetInnerHTML' && val && val.__html !== undefined) {
      el.innerHTML = val.__html;
      return;
    }

    if (val === false || val === null || val === undefined) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, val === true ? '' : String(val));
    }
  }

  function createDomNode(vnode, isParentSvg = false) {
    // 1. Strings & Numbers
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      const str = String(vnode);
      // Double check if string starts with an SVG/HTML element tag to avoid raw markup rendering
      const trimmed = str.trim();
      if ((trimmed.startsWith('<svg') || trimmed.startsWith('<div') || trimmed.startsWith('<span')) && trimmed.endsWith('>')) {
        const temp = document.createElement('div');
        temp.innerHTML = trimmed;
        if (temp.childNodes.length === 1) return temp.childNodes[0];
        const frag = document.createDocumentFragment();
        while (temp.firstChild) frag.appendChild(temp.firstChild);
        return frag;
      }
      return document.createTextNode(str);
    }

    // 2. Falsy values
    if (!vnode || typeof vnode !== 'object') {
      return document.createTextNode('');
    }

    // 3. Functional components
    if (typeof vnode.type === 'function') {
      return createDomNode(vnode.type(vnode.props, vnode.children), isParentSvg);
    }

    // 4. Element nodes (SVG vs HTML)
    const tagName = String(vnode.type).toLowerCase();
    const isSvg = isParentSvg || SVG_ELEMENTS.has(tagName);

    const el = isSvg
      ? document.createElementNS('http://www.w3.org/2000/svg', tagName)
      : document.createElement(tagName);

    // Apply attributes
    if (vnode.props) {
      for (let k in vnode.props) {
        setAttribute(el, k, vnode.props[k], isSvg);
      }
    }

    // If dangerouslySetInnerHTML was used, children are already set
    if (vnode.props && vnode.props.dangerouslySetInnerHTML) {
      return el;
    }

    // Append children
    if (vnode.children) {
      for (let child of vnode.children) {
        if (Array.isArray(child)) {
          for (let c of child) {
            if (c !== null && c !== undefined && c !== false) {
              el.appendChild(createDomNode(c, isSvg));
            }
          }
        } else if (child !== null && child !== undefined && child !== false) {
          el.appendChild(createDomNode(child, isSvg));
        }
      }
    }

    // Re-apply value on SELECT elements AFTER child options are appended to the DOM
    if (tagName === 'select' && vnode.props && vnode.props.value !== undefined) {
      const expectedVal = String(vnode.props.value);
      el.value = expectedVal;
      if (el.options && el.options.length > 0) {
        for (let i = 0; i < el.options.length; i++) {
          el.options[i].selected = (el.options[i].value === expectedVal);
        }
      }
    }

    return el;
  }

  function mount(componentFn, container) {
    rootComponentFn = componentFn;
    rootContainer = container;
    renderApp();
  }

  // Export to global scope
  global.React = {
    createElement: h,
    useState,
    useEffect,
    useRef,
    setHookContext,
    render: (vnode, container) => {
      mount(() => vnode, container);
    }
  };
  global.h = h;
  global.html = html;
  global.mount = mount;
  global.scheduleRender = scheduleRender;
  global.setHookContext = setHookContext;
})(window);
