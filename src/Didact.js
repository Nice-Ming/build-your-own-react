const TEXT_ELEMENT = 'TEXT_ELEMENT'

function createTextElement (text) {
  return {
    type: TEXT_ELEMENT,
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

function createElement (type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === 'object'
          ? child
          : createTextElement(child),
      ),
    },
  }
}

function createDom (fiber) {
  const dom =
    fiber.type === TEXT_ELEMENT
      ? document.createTextNode('')
      : document.createElement(fiber.type)

  const isProperty = key => key !== 'children'

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = fiber.props[name]
    })

  fiber.props.children.forEach(child => {
    render(child, dom)
  })

  return dom
}

function render (element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  }

  nextUnitOfWork = wipRoot
}

export default {
  createElement,
  render,
}
