/**
 * DOM Utility Functions
 */

/**
 * Create element with attributes and children.
 *
 * - Properties (`className`, `value`, `textContent`…) are set directly via
 *   `Object.assign` so they behave like JS properties.
 * - Hyphenated attributes such as `aria-label`, `data-*` and `role` go
 *   through `setAttribute` because the JS property names differ
 *   (`ariaLabel`, `dataset.*`) and `Object.assign` would silently create
 *   an expando JS property instead of a real DOM attribute.
 * - The convenience keys `class` and `html` are handled separately.
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  const directProps = {};
  Object.entries(attrs || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'class' || key === 'html') return;
    if (key.includes('-') || key === 'role' || key.startsWith('aria')) {
      el.setAttribute(key, String(value));
    } else {
      directProps[key] = value;
    }
  });
  Object.assign(el, directProps);
  if (attrs.class) el.classList.add(...attrs.class.split(' ').filter(Boolean));
  if (attrs.html) el.innerHTML = attrs.html;
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  });
  return el;
}

/**
 * Set classes on element
 * @param {HTMLElement} el - Element
 * @param {string|string[]} classes - Classes to add
 */
export function setClasses(el, classes) {
  if (Array.isArray(classes)) {
    el.classList.add(...classes);
  } else {
    el.classList.add(...classes.split(' '));
  }
}

/**
 * Remove classes from element
 * @param {HTMLElement} el - Element
 * @param {string|string[]} classes - Classes to remove
 */
export function removeClasses(el, classes) {
  if (Array.isArray(classes)) {
    el.classList.remove(...classes);
  } else {
    el.classList.remove(...classes.split(' '));
  }
}

/**
 * Add event listener with options
 * @param {HTMLElement} el - Element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {object} options - Event options
 */
export function on(el, event, handler, options = {}) {
  el.addEventListener(event, handler, options);
  return () => el.removeEventListener(event, handler, options);
}

/**
 * Query selector
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Query selector all
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element
 */
export function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}
