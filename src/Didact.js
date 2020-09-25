const TEXT_ELEMENT = 'TEXT_ELEMENT'

const EffectTags = {
  UPDATE: 'UPDATE',
  PLACEMENT: 'PLACEMENT',
  DELETION: 'DELETION',
}

let nextUnitOfWork = null
let workInProgressRoot = null
let currentRoot = null
let deletions = null

function performUnitOfWork (fiber) {
  // add dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  // create new fibers
  const elements = fiber.props.children
  reconcileChildren(fiber, elements)

  // return next unit of work
  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }

    nextFiber = nextFiber.parent
  }
}

function reconcileChildren (workInProgressFiber, elements) {
  let index = 0
  let oldFiber = workInProgressFiber.alternate && workInProgressFiber.alternate.child
  let prevSibling = null

  while (
    index < elements.length ||
    oldFiber != null // oldFiber maybe is undefined
  ) {
    const element = elements[index]
    let newFiber = null

    // compare oldFiber to element
    const sameType =
      oldFiber &&
      element &&
      oldFiber.type === element.type

    if (sameType) {
      // update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        parent: workInProgressFiber,
        dom: oldFiber.dom,
        alternate: oldFiber,
        effectTag: EffectTags.UPDATE,
      }
    }

    if (element && !sameType) {
      // replace the node
      newFiber = {
        type: element.type,
        props: element.props,
        parent: workInProgressFiber,
        dom: null,
        alternate: null,
        effectTag: EffectTags.PLACEMENT,
      }
    }

    if (oldFiber && !sameType) {
      // delete the node
      oldFiber.effectTag = EffectTags.DELETION
      deletions.push(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      workInProgressFiber.child = newFiber
    } else if (element) {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }
}

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

  updateDom(dom, {}, fiber.props)

  return dom
}

function updateDom (dom, prevProps, nextProps) {
  const isEvent = key => key.startsWith('on')
  const isProperty = key => key !== 'children' && !isEvent(key)
  const isNew = (prev, next) => key => prev[key] !== next[key]
  const isGone = (prev, next) => key => !(key in next)

  // remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key),
    ).forEach(name => {
      const eventType = name.toLowerCase().substring(2)

      dom.removeEventListener(
        eventType,
        prevProps[name],
      )
    })

  // remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ''
    })

  // set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })

  // add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)

      dom.addEventListener(
        eventType,
        nextProps[name],
      )
    })
}

function commitRoot () {
  deletions.forEach(commitWork)
  commitWork(workInProgressRoot.child)
  currentRoot = workInProgressRoot
  workInProgressRoot = null
}

function commitWork (fiber) {
  if (!fiber) {
    return
  }

  const domParent = fiber.parent.dom

  if (
    fiber.effectTag === EffectTags.PLACEMENT &&
    fiber.dom !== null
  ) {
    domParent.appendChild(fiber.dom)
  } else if (
    fiber.effectTag === EffectTags.UPDATE &&
    fiber.dom !== null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props,
    )
  } else if (fiber.effectTag === EffectTags.DELETION) {
    domParent.removeChild(fiber.dom)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function workLoop (deadline) {
  let shouldYield = false

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)

    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && workInProgressRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function render (element, container) {
  workInProgressRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  }

  deletions = []
  nextUnitOfWork = workInProgressRoot
}

export default {
  createElement,
  render,
}
