export function createElement(type = 'div', attrs = {}) {
  const element = document.createElement(type);
  for (let attr in attrs) {
    const value = attrs[attr];
    if (attr.startsWith('data-')) {
      element.setAttribute(attr, value);
    } else if (attr === 'id') {
      element.id = value;
    } else if (attr === 'class') {
      value.split(' ').forEach((c) => element.classList.add(c));
    } else {
      throw new Error(`Attr ${attr} not supported`);
    }
  }
  return element;
}
