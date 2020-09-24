/** @jsx Didact.createElement */
import Didact from './Didact'

const element = (
  <div id="foo">
    <p>bar</p>
    <b />
  </div>
)

const container = document.getElementById('root')

console.log(element)

Didact.render(element, container)
