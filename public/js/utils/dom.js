/**
 * DOM Utility Functions
 */

/**
 * Create element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {object} attrs - Attributes and properties
 * @param {array} children - Child nodes
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.assign(el, attrs);
  if (attrs.class) el.classList.add(...attrs.class.split(' '));
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
 * Query selector with error handling
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 */
export function $(selector, parent = document) {
  const el = parent.querySelector(selector);
  if (!el) {
    console.warn(`Element not found: ${selector}`);
  }
  return el;
}

/**
 * Query selector all
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element
 */
export function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}
